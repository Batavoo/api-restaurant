# data "google_iam_policy" "secretmanager_secret_accessor_role_binding_policy" {
#   binding {
#     members = ["serviceAccount:service-560057939373@gcp-sa-cloudbuild.iam.gserviceaccount.com"]
#     role    = "roles/secretmanager.secretAccessor"
#   }
# }

# resource "google_secret_manager_secret_iam_policy" "github_token_secret_policy" {
#   policy_data = data.google_iam_policy.secretmanager_secret_accessor_role_binding_policy.policy_data
#   secret_id   = google_secret_manager_secret.github_token_secret.id
# }

# resource "google_secret_manager_secret" "github_token_secret" {
#   secret_id           = "github-connection-github-oauthtoken-b4b186"
#   deletion_protection = false

#   replication {
#     user_managed {
#       replicas {
#         location = var.gcp_region
#       }
#     }
#   }
# }

# resource "google_secret_manager_secret_version" "github_token_secret_version" {
#   secret      = "projects/560057939373/secrets/github-connection-github-oauthtoken-b4b186"
#   secret_data = ""
# }

resource "google_project_iam_member" "sonarqube_secret_accessor" {
  member  = "serviceAccount:${google_service_account.sonarqube_sa.email}"
  project = var.project_name
  role    = "roles/secretmanager.secretAccessor"
}

resource "google_secret_manager_secret" "db_password_secret" {
  secret_id           = "db-password"
  deletion_protection = false
  depends_on          = [google_project_service.required_apis]

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "db_password_secret_version" {
  secret      = google_secret_manager_secret.db_password_secret.id
  secret_data = var.db_password
}
