resource "google_compute_network" "vpc" {
  name                    = "vpc"
  description             = "VPC network"
  auto_create_subnetworks = false
  routing_mode            = "GLOBAL"
  depends_on              = [google_project_service.required_apis]
}

resource "google_compute_subnetwork" "subnet" {
  name                     = "subnet"
  description              = "Subnetwork"
  ip_cidr_range            = "10.1.0.0/24"
  network                  = google_compute_network.vpc.id
  private_ip_google_access = true
}

resource "google_compute_router" "nat_router" {
  name    = "nat-router"
  network = google_compute_network.vpc.id
}

resource "google_compute_router_nat" "nat" {
  name                               = "nat"
  router                             = google_compute_router.nat_router.name
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}

resource "google_compute_global_address" "private_ip_range" {
  name          = "private-ip-range"
  description   = "Private IP range for Google services"
  address_type  = "INTERNAL"
  network       = google_compute_network.vpc.id
  prefix_length = 16
  purpose       = "VPC_PEERING"
}

resource "google_compute_global_address" "static_ip" {
  name         = "static-ip"
  description  = "Static external IP address"
  address_type = "EXTERNAL"
}

resource "google_compute_health_check" "health_check" {
  name                = "health-check"
  description         = "Health check"
  check_interval_sec  = 30
  healthy_threshold   = 2
  unhealthy_threshold = 3
  timeout_sec         = 10

  http_health_check {
    port         = 9000
    request_path = "/api/system/status"
  }
}

resource "google_compute_backend_service" "backend_service" {
  name                            = "backend-service"
  description                     = "Backend service"
  connection_draining_timeout_sec = 30
  health_checks                   = [google_compute_health_check.health_check.id]
  port_name                       = "http"
  protocol                        = "HTTP"
  security_policy                 = google_compute_security_policy.security_policy.id
  timeout_sec                     = 30

  backend {
    description     = "Backend service"
    balancing_mode  = "UTILIZATION"
    group           = google_compute_instance_group.sonarqube_instance_group.id
    max_utilization = 0.8
  }
}

resource "google_service_account" "sonarqube_sa" {
  account_id   = "sonarqube-sa"
  display_name = "SonarQube Service Account"
  description  = "Service account for SonarQube instance"
}

resource "google_project_iam_member" "sonarqube_sa_permissions" {
  for_each = toset([
    "roles/cloudsql.client",
    "roles/logging.logWriter",
    "roles/secretmanager.secretAccessor"
  ])
  member  = "serviceAccount:${google_service_account.sonarqube_sa.email}"
  project = var.project_name
  role    = each.key
}

resource "google_compute_disk" "sonarqube_data" {
  name        = "sonarqube-data"
  description = "Disk for SonarQube data"
  size        = 100
  type        = "pd-standard"
  zone        = var.zone
}

resource "google_compute_instance" "sonarqube_instance" {
  name                      = "sonarqube-server"
  description               = "Instance for SonarQube server"
  allow_stopping_for_update = true
  deletion_protection       = false
  machine_type              = "n2-standard-2"
  zone                      = var.zone
  tags                      = ["sonarqube-server", "sonarqube-backend"]
  metadata_startup_script = templatefile("${path.module}/scripts/startup.sh", {
    db_name            = var.db_name
    db_host            = google_sql_database_instance.postgres.private_ip_address
    db_user            = var.db_user
    db_password_secret = google_secret_manager_secret.db_password_secret.secret_id
  })

  attached_disk {
    device_name = google_compute_disk.sonarqube_data.name
    source      = google_compute_disk.sonarqube_data.id
  }

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2404-lts-amd64"
      size  = 20
      type  = "pd-standard"
    }
  }

  network_interface {
    network    = google_compute_network.vpc.id
    subnetwork = google_compute_subnetwork.subnet.id
  }

  service_account {
    email  = google_service_account.sonarqube_sa.email
    scopes = ["cloud-platform"]
  }
}

resource "google_compute_instance_group" "sonarqube_instance_group" {
  name        = "sonarqube-instance-group"
  description = "Instance group for SonarQube"
  instances   = [google_compute_instance.sonarqube_instance.id]
  zone        = var.zone

  named_port {
    name = "http"
    port = 9000
  }
}

resource "google_compute_firewall" "sonarqube_firewall" {
  name        = "sonarqube-firewall"
  description = "Firewall rules for SonarQube instance"
  network     = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["9000"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["sonarqube-server"]
}

resource "google_compute_security_policy" "security_policy" {
  name        = "security-policy"
  description = "Security policy for Cloud Armor"

  rule {
    action      = "throttle"
    description = "Rate limiting rule"
    priority    = 2147483647

    match {
      versioned_expr = "SRC_IPS_V1"

      config {
        src_ip_ranges = ["*"]
      }
    }

    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      enforce_on_key = "IP"

      rate_limit_threshold {
        count        = 100
        interval_sec = 60
      }
    }
  }
}

resource "google_compute_url_map" "url_map" {
  name            = "url-map"
  description     = "URL map for load balancing"
  default_service = google_compute_backend_service.backend_service.id
}

resource "google_compute_target_https_proxy" "https_proxy" {
  name             = "https-proxy"
  description      = "HTTPS proxy for load balancing"
  ssl_certificates = [google_compute_managed_ssl_certificate.sonarqube_ssl_cert.id]
  url_map          = google_compute_url_map.url_map.id

  lifecycle {
    replace_triggered_by = [google_compute_managed_ssl_certificate.sonarqube_ssl_cert]
  }
}

resource "google_compute_managed_ssl_certificate" "sonarqube_ssl_cert" {
  name        = "sonarqube-ssl-cert"
  description = "Managed SSL certificate for SonarQube"

  managed {
    domains = ["sonarqube.${google_compute_global_address.static_ip.address}.nip.io"]
  }
}

resource "google_compute_global_forwarding_rule" "forwarding_rule" {
  name        = "https-forwarding-rule"
  description = "Forwarding rule for HTTPS traffic"
  ip_address  = google_compute_global_address.static_ip.address
  port_range  = "443"
  target      = google_compute_target_https_proxy.https_proxy.id
}
