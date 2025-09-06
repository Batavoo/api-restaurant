resource "google_project_iam_member" "sonarqube_cloudsql_client" {
  member  = "serviceAccount:${google_service_account.sonarqube_sa.email}"
  project = var.project_name
  role    = "roles/cloudsql.client"
}

resource "google_sql_database_instance" "postgres" {
  name                = "postgres"
  database_version    = "POSTGRES_15"
  deletion_protection = false
  depends_on          = [google_project_service.required_apis]

  settings {
    availability_type           = "REGIONAL"
    deletion_protection_enabled = false
    disk_autoresize             = true
    disk_autoresize_limit       = 500
    disk_size                   = 100
    disk_type                   = "PD_HDD"
    tier                        = "db-custom-2-7680"

    database_flags {
      name  = "autovacuum_vacuum_scale_factor"
      value = "0.1"
    }

    database_flags {
      name  = "effective_cache_size"
      value = "688128"
    }

    database_flags {
      name  = "max_connections"
      value = "200"
    }

    database_flags {
      name  = "shared_buffers"
      value = "589824"
    }

    database_flags {
      name  = "work_mem"
      value = "4096"
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
    }
  }

  lifecycle {
    ignore_changes = [settings[0].disk_size]
  }
}

resource "google_sql_database" "sonarqube" {
  name     = "sonarqube"
  instance = google_sql_database_instance.postgres.name
  charset  = "UTF8"
}

resource "google_sql_user" "sonarqube_user" {
  name     = "sonar"
  instance = google_sql_database_instance.postgres.name
  password = var.db_password
}
