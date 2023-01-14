defmodule Platform.Projects.Project do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "projects" do
    field(:code, :string)
    field(:name, :string)
    field(:description, :string, default: "")
    field(:color, :string, default: "#f87171")

    has_many(:media, Platform.Material.Media)

    timestamps()
  end

  @doc false
  def changeset(project, attrs) do
    project
    |> cast(attrs, [:name, :code, :color, :description])
    |> validate_required([:name, :code, :color])
    |> validate_length(:code, min: 1, max: 5)
    |> validate_length(:name, min: 1, max: 100)
    |> validate_length(:description, min: 0, max: 1000)
    |> validate_format(:color, ~r/^#[0-9a-fA-F]{6}$/)
  end
end

defimpl Jason.Encoder, for: Platform.Projects.Project do
  def encode(value, opts) do
    Jason.Encode.map(
      Map.take(value, [
        :name,
        :code,
        :description,
        :color,
        :id
      ])
      |> Enum.into(%{}, fn
        {key, %Ecto.Association.NotLoaded{}} -> {key, nil}
        {key, value} -> {key, value}
      end),
      opts
    )
  end
end
