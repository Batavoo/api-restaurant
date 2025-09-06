# resource "google_service_account" "cloudbuild_service_account" {
#   account_id   = "cloudbuild-sa"
#   display_name = "Cloud Build Service Account"
#   description  = "Service Account for Cloud Build with necessary permissions"
# }

resource "google_cloudbuildv2_connection" "github_connection" {
  name     = "github-connection"
  location = var.region

  github_config {
    app_installation_id = 83448691

    authorizer_credential {
      oauth_token_secret_version = "projects/pede-ja-api/secrets/github-connection-github-oauthtoken-b4b186/versions/latest"
    }
  }
}

resource "google_cloudbuildv2_repository" "github_repository" {
  name              = "github-api-restaurant-repository"
  location          = var.region
  parent_connection = google_cloudbuildv2_connection.github_connection.name
  remote_uri        = "https://github.com/${var.github_repository_name}.git"
}
