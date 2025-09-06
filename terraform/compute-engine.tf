resource "google_compute_network" "vpc" {
  name                    = "vpc"
  description             = "VPC network"
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
  depends_on              = [google_project_service.required_apis]
}

resource "google_compute_subnetwork" "subnet" {
  name                     = "subnet"
  description              = "Subnetwork"
  ip_cidr_range            = "10.1.0.0/24"
  network                  = google_compute_network.vpc.id
  private_ip_google_access = true
}

resource "google_compute_global_address" "private_ip_range" {
  name          = "private-ip-range"
  description   = "Private IP range for Google services"
  address_type  = "INTERNAL"
  network       = google_compute_network.vpc.id
  prefix_length = 16
  purpose       = "VPC_PEERING"
}

resource "google_compute_address" "static_ip" {
  name         = "static-ip"
  description  = "Static external IP address"
  address_type = "EXTERNAL"
}

resource "google_service_account" "sonarqube_sa" {
  account_id   = "sonarqube-sa"
  display_name = "SonarQube Service Account"
  description  = "Service account for SonarQube instance"
}

resource "google_project_iam_member" "sonarqube_sa_log_writer" {
  member  = "serviceAccount:${google_service_account.sonarqube_sa.email}"
  project = var.project_name
  role    = "roles/logging.logWriter"
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
  tags                      = ["sonarqube-server"]
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

    access_config {
      nat_ip = google_compute_address.static_ip.address
    }
  }

  service_account {
    email  = google_service_account.sonarqube_sa.email
    scopes = ["cloud-platform"]
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
