# resource "google_cloudfunctions2_function" "api_function" {
#   name        = "api-function"
#   description = "Function to handle HTTP requests for the API restaurant service."
#   location    = "us-east1"
#   project     = var.project_id

#   build_config {
#     entry_point = "server"
#     runtime     = "nodejs20"
#     environment_variables = {
#       PORT = "3333"
#     }

#     source {
#       storage_source {
#         bucket = google_storage_bucket.api_bucket.name
#         object = var.api_bucket_object_name
#       }
#     }
#   }

#   service_config {
#     max_instance_count = 1
#     available_memory   = "256M"
#     timeout_seconds    = 60
#   }
# }
