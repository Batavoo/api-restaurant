########## Staging ##########

resource "google_service_account" "cloudbuild_service_account" {
  account_id = "build-sa"
}

resource "google_project_iam_member" "act_as" {
  project = data.google_project.project.project_id
  role    = "roles/iam.serviceAccountUser"
  member  = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github_pool.name}/attribute.repository/${var.github_repository}"
  # member  = "serviceAccount:${google_service_account.cloudbuild_service_account.email}"
}

resource "google_cloud_run_v2_service" "stg_api_restaurant_service" {
  name                = "api-restaurant-stg"
  deletion_protection = false
  location            = var.gcp_region

  template {
    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello"
      # image = "${var.gcp_region}-docker.pkg.dev/${var.gcp_project_name}/${google_artifact_registry_repository.repository.name}/api-restaurant-stg:latest"
      #   # base_image_uri = "us-central1-docker.pkg.dev/serverless-runtimes/google-22-full/runtimes/nodejs22"
    }
  }

  # ingress = "INGRESS_TRAFFIC_ALL"

  # build_config {
  #   source_location = "gs://${google_storage_bucket.bucket.name}/${google_storage_bucket_object.object.name}"
  #   function_target = "helloHttp"
  #   image_uri = "us-docker.pkg.dev/cloudrun/container/hello"
  #   base_image = "us-central1-docker.pkg.dev/serverless-runtimes/google-22-full/runtimes/nodejs22"
  #   enable_automatic_updates = true
  #   environment_variables = {
  #     FOO_KEY = "FOO_VALUE"
  #     BAR_KEY = "BAR_VALUE"
  #   }
  #   service_account = google_service_account.cloudbuild_service_account.id
  # }
}

resource "google_cloud_run_v2_service_iam_binding" "run_admin_binding" {
  name    = google_cloud_run_v2_service.stg_api_restaurant_service.name
  members = ["principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github_pool.name}/attribute.repository/${var.github_repository}"]
  role    = "roles/run.admin"
}
