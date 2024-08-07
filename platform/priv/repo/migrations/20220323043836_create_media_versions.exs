defmodule Platform.Repo.Migrations.CreateMediaVersions do
  use Ecto.Migration

  def change do
    create table(:media_versions) do
      add :file_location, :string
      add :file_size, :integer
      add :duration_seconds, :integer
      add :perceptual_hash, :binary, nullable: true
      add :source_url, :string
      add :mime_type, :string
      add :client_name, :string
      # Hashes added ex post to aid later data migrations
      add :hashes, :map, default: %{}
      add :media_id, references(:media, on_delete: :nothing)

      timestamps()
    end

    create index(:media_versions, [:media_id])
    create index(:media_versions, [:source_url])
  end
end
