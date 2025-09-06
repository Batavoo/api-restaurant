# # ########## Staging ##########

# # resource "google_service_account" "cloudbuild_service_account" {
# #   account_id = "build-sa"
# # }

# # resource "google_project_iam_member" "act_as" {
# #   project = data.google_project.project.project_id
# #   role    = "roles/iam.serviceAccountUser"
# #   member  = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github_pool.name}/attribute.repository/${var.github_repository}"
# #   # member  = "serviceAccount:${google_service_account.cloudbuild_service_account.email}"
# # }

# # resource "google_cloud_run_v2_service" "stg_api_restaurant_service" {
# #   name                = "api-restaurant-stg"
# #   deletion_protection = false
# #   location            = var.gcp_region

# #   template {
# #     containers {
# #       image = "us-docker.pkg.dev/cloudrun/container/hello"
# #       # image = "${var.gcp_region}-docker.pkg.dev/${var.gcp_project_name}/${google_artifact_registry_repository.repository.name}/api-restaurant-stg:latest"
# #       #   # base_image_uri = "us-central1-docker.pkg.dev/serverless-runtimes/google-22-full/runtimes/nodejs22"
# #     }
# #   }

# #   # ingress = "INGRESS_TRAFFIC_ALL"

# #   # build_config {
# #   #   source_location = "gs://${google_storage_bucket.bucket.name}/${google_storage_bucket_object.object.name}"
# #   #   function_target = "helloHttp"
# #   #   image_uri = "us-docker.pkg.dev/cloudrun/container/hello"
# #   #   base_image = "us-central1-docker.pkg.dev/serverless-runtimes/google-22-full/runtimes/nodejs22"
# #   #   enable_automatic_updates = true
# #   #   environment_variables = {
# #   #     FOO_KEY = "FOO_VALUE"
# #   #     BAR_KEY = "BAR_VALUE"
# #   #   }
# #   #   service_account = google_service_account.cloudbuild_service_account.id
# #   # }
# # }

# # resource "google_cloud_run_v2_service_iam_binding" "run_admin_binding" {
# #   name    = google_cloud_run_v2_service.stg_api_restaurant_service.name
# #   members = ["principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github_pool.name}/attribute.repository/${var.github_repository}"]
# #   role    = "roles/run.admin"
# # }

# resource "google_cloud_run_v2_service" "postgres_service" {
#   name                = "postgres"
#   deletion_protection = false
#   ingress             = "INGRESS_TRAFFIC_ALL"
#   location            = var.gcp_region

#   template {

#     containers {
#       name  = "postgres"
#       image = "postgres:15"
#       # base_image_uri = "docker.io/sonarqube:community"
#       # depends_on = [db]

#       env {
#         name  = "POSTGRES_USER"
#         value = "sonar"
#       }

#       env {
#         name  = "POSTGRES_PASSWORD"
#         value = "sonarpass"
#       }

#       env {
#         name  = "POSTGRES_DB"
#         value = "sonarqube"
#       }

#       ports {
#         container_port = 5432
#       }

#       volume_mounts {
#         name       = "sonarqube_db_data"
#         mount_path = "/var/lib/postgresql/data"
#       }
#     }

#     volumes {
#       name = "sonarqube_db_data"
#       empty_dir {}
#     }
#   }
# }

# resource "google_cloud_run_v2_service" "sonarqube_service" {
#   name                = "sonarqube"
#   deletion_protection = false
#   ingress             = "INGRESS_TRAFFIC_ALL"
#   location            = var.gcp_region
#   depends_on          = [google_cloud_run_v2_service.postgres_service]
#   template {

#     containers {
#       name  = "sonarqube"
#       image = "sonarqube:community"
#       # base_image_uri = "docker.io/sonarqube:community"

#       env {
#         name  = "SONAR_JDBC_URL"
#         value = "jdbc:postgresql://postgres-560057939373.us-east1.run.appdb:5432/sonarqube"
#       }

#       env {
#         name  = "SONAR_JDBC_USERNAME"
#         value = "sonar"
#       }

#       env {
#         name  = "SONAR_JDBC_PASSWORD"
#         value = "sonarpass"
#       }

#       ports {
#         container_port = 9000
#       }

#       resources {
#         limits = {
#           memory = "1Gi"
#           cpu    = "1"
#         }
#       }

#       volume_mounts {
#         name       = "sonarqube_data"
#         mount_path = "/opt/sonarqube/data"
#       }

#       volume_mounts {
#         name       = "sonarqube_extensions"
#         mount_path = "/opt/sonarqube/extensions"
#       }

#       volume_mounts {
#         name       = "sonarqube_logs"
#         mount_path = "/opt/sonarqube/logs"
#       }
#     }

#     volumes {
#       name = "sonarqube_data"
#       empty_dir {}
#     }

#     volumes {
#       name = "sonarqube_extensions"
#       empty_dir {}
#     }

#     volumes {
#       name = "sonarqube_logs"
#       empty_dir {}
#     }
#   }
# }

# # data "google_project" "project" {
# # }

# # resource "google_storage_bucket" "bucket" {
# #   name     = "${data.google_project.project.project_id}-gcf-source"  # Every bucket name must be globally unique
# #   location = "US"
# #   uniform_bucket_level_access = true
# # }

# # resource "google_storage_bucket_object" "object" {
# #   name   = "function-source.zip"
# #   bucket = google_storage_bucket.bucket.name
# #   source = "function_source.zip"  # Add path to the zipped function source code
# # }

# # resource "google_service_account" "cloudbuild_service_account" {
# #   account_id = "build-sa"
# # }

# # resource "google_project_iam_member" "act_as" {
# #   project = data.google_project.project.project_id
# #   role    = "roles/iam.serviceAccountUser"
# #   member  = "serviceAccount:${google_service_account.cloudbuild_service_account.email}"
# # }

# # resource "google_project_iam_member" "logs_writer" {
# #   project = data.google_project.project.project_id
# #   role    = "roles/logging.logWriter"
# #   member  = "serviceAccount:${google_service_account.cloudbuild_service_account.email}"
# # }