# locals {
#   workload_identity_pool_roles = [
#     # # Cloud Build
#     # "roles/cloudbuild.builds.editor",
#     # # Cloud Storage
#     # "roles/storage.admin",
#   ]
# }

resource "google_iam_workload_identity_pool" "github_pool" {
  display_name              = "GitHub Pool"
  description               = "Workload Identity Pool for GitHub Actions"
  workload_identity_pool_id = "github-pool"
}

resource "google_iam_workload_identity_pool_provider" "github_provider" {
  display_name                       = "GitHub Provider"
  description                        = "Workload Identity Pool Provider for GitHub Actions"
  workload_identity_pool_id          = google_iam_workload_identity_pool.github_pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  attribute_condition                = "attribute.repository == '${var.github_repository}'"
  attribute_mapping = {
    "attribute.actor"      = "assertion.actor"
    "attribute.aud"        = "assertion.aud"
    "attribute.repository" = "assertion.repository"
    "google.subject"       = "assertion.sub"
  }

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}
