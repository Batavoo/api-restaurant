########## Staging ##########

resource "google_cloud_run_v2_service" "stg_api_restaurant_service" {
  name                = "api-restaurant-stg"
  deletion_protection = false
  location            = var.gcp_region

  template {
    containers {
      image          = "us-docker.pkg.dev/cloudrun/container/hello"
      base_image_uri = "us-central1-docker.pkg.dev/serverless-runtimes/google-22-full/runtimes/nodejs22"
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

resource "google_cloud_run_v2_service_iam_binding" "source_developer_iam_binding" {
  name     = google_cloud_run_v2_service.stg_api_restaurant_service.name
  location = var.gcp_region
  members  = ["principal://iam.googleapis.com/${google_iam_workload_identity_pool.github_workload_identity_pool.name}/subject/repo"]
  # principal://iam.googleapis.com/projects/560057939373/locations/global/workloadIdentityPools/github-wif-pool/subject/repo:Pos-Grad-Devops/api-restaurant:ref:refs/heads/feature/add-cloud-run-iac
  role = "roles/run.sourceDeveloper"
}
