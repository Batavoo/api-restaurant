data "google_iam_policy" "secretmanager_secret_accessor_role_binding_policy" {
  binding {
    members = ["serviceAccount:service-560057939373@gcp-sa-cloudbuild.iam.gserviceaccount.com"]
    role    = "roles/secretmanager.secretAccessor"
  }
}

resource "google_secret_manager_secret_iam_policy" "github_token_secret_policy" {
  policy_data = data.google_iam_policy.secretmanager_secret_accessor_role_binding_policy.policy_data
  secret_id   = google_secret_manager_secret.github_token_secret.id
}

resource "google_secret_manager_secret" "github_token_secret" {
  secret_id           = "github-connection-github-oauthtoken-b4b186"
  deletion_protection = false

  replication {
    user_managed {
      replicas {
        location = var.gcp_region
      }
    }
  }
}

resource "google_secret_manager_secret_version" "github_token_secret_version" {
  secret      = "projects/560057939373/secrets/github-connection-github-oauthtoken-b4b186"
  secret_data = ""
}
