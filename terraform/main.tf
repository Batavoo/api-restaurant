terraform {
  required_providers {
    # archive = {
    #   source  = "hashicorp/archive"
    #   version = "2.7.1"
    # }

    google = {
      source  = "hashicorp/google"
      version = "7.0.1"
    }
  }
}

provider "google" {
  project = var.gcp_project_name
}

data "google_project" "project" {}
