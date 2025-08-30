# resource "google_artifact_registry_repository" "repository" {
#   repository_id = "cloud-run-source-deploy"
#   format        = "DOCKER"
#   # location      = var.gcp_region
# }

# resource "google_artifact_registry_repository_iam_binding" "binding" {
#   members    = ["principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github_pool.name}/attribute.repository/${var.github_repository}"]
#   repository = google_artifact_registry_repository.repository.name
#   role       = "roles/artifactregistry.admin"
# }
