# data "archive_file" "api_archive_file" {
#   type        = "zip"
#   output_path = "./${var.api_bucket_object_name}"
#   source_dir  = ".."
# }

# resource "google_storage_bucket" "api_bucket" {
#   name                        = "${var.project_id}-source"
#   force_destroy               = true # TODO: remover.
#   location                    = "US"
#   project                     = var.project_id
#   uniform_bucket_level_access = true
# }

# resource "google_storage_bucket_object" "api_bucket_object" {
#   name   = var.api_bucket_object_name
#   bucket = google_storage_bucket.api_bucket.name
#   source = data.archive_file.api_archive_file.output_path
# }
