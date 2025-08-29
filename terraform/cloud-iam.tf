resource "google_iam_workload_identity_pool" "github_workload_identity_pool" {
  display_name              = "GitHub WIF Pool"
  description               = "Workload Identity Pool for GitHub Actions"
  workload_identity_pool_id = "github-wif-pool"
}

resource "google_iam_workload_identity_pool_provider" "github_workload_identity_pool_provider" {
  display_name                       = "GitHub WIF Provider"
  description                        = "Workload Identity Pool Provider for GitHub Actions"
  workload_identity_pool_id          = google_iam_workload_identity_pool.github_workload_identity_pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-wif-provider"
  attribute_condition                = "attribute.repository == 'Pos-Grad-Devops/api-restaurant'"
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
