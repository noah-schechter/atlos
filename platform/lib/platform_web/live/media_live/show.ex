defmodule PlatformWeb.MediaLive.Show do
  use PlatformWeb, :live_view
  alias Platform.Material
  alias Material.Attribute
  alias Platform.Updates
  alias PlatformWeb.MediaLive.EditAttribute

  def mount(_params, _session, socket) do
    {:ok, socket}
  end

  def handle_params(%{"slug" => slug} = params, _uri, socket) do
    {:noreply,
     socket
     |> assign(:slug, slug)
     |> assign(:attribute, Map.get(params, "attribute"))
     |> assign_media_and_updates()}
  end

  defp assign_media_and_updates(socket) do
    with %Material.Media{} = media <- Material.get_full_media_by_slug(socket.assigns.slug) do
      socket |> assign(:media, media) |> assign(:updates, Updates.get_updates_for_media(media))
    else
      nil ->
        socket
        |> put_flash(:error, "This media does not exist or is not publicly visible.")
        |> redirect(to: "/")
    end
  end
end