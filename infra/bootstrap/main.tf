terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# TODO: Apagar essa parte depois que fizer destroy do cloudrun
resource "google_storage_bucket" "tf_state" {
  name          = "tf-state-${var.project_id}"
  location      = var.region
  force_destroy = false

  versioning {
    enabled = true
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_storage_bucket_iam_member" "tf_state_admin" {
  bucket = google_storage_bucket.tf_state.name
  role   = "roles/storage.admin"
  member = "serviceAccount:${var.service_account_email}"
}

output "tf_state_bucket" {
  value = google_storage_bucket.tf_state.name
}
