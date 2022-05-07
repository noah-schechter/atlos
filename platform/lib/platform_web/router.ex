defmodule PlatformWeb.Router do
  use PlatformWeb, :router

  import PlatformWeb.UserAuth
  alias PlatformWeb.MountHelperLive

  pipeline :browser do
    plug(:accepts, ["html"])
    plug(:fetch_session)
    plug(:fetch_live_flash)
    plug(:put_root_layout, {PlatformWeb.LayoutView, :root})
    plug(:protect_from_forgery)
    plug(:put_secure_browser_headers)
    plug(:fetch_current_user)
  end

  pipeline :app do
    plug(:put_layout, {PlatformWeb.LayoutView, "app.html"})
  end

  pipeline :interstitial do
    plug(:put_layout, {PlatformWeb.LayoutView, "interstitial.html"})
  end

  pipeline :api do
    plug(:accepts, ["json"])
  end

  # Enables LiveDashboard only for development
  #
  # If you want to use the LiveDashboard in production, you should put
  # it behind authentication and allow only admins to access it.
  # If your application does not have an admins-only section yet,
  # you can use Plug.BasicAuth to set up some basic authentication
  # as long as you are also using SSL (which you should anyway).
  if Mix.env() in [:dev, :test] do
    import Phoenix.LiveDashboard.Router

    scope "/" do
      pipe_through(:browser)

      live_dashboard("/dashboard", metrics: PlatformWeb.Telemetry)
    end
  end

  # Enables the Swoosh mailbox preview in development.
  #
  # Note that preview only shows emails that were sent by the same
  # node running the Phoenix server.
  if Mix.env() == :dev do
    scope "/dev" do
      pipe_through(:browser)

      forward("/mailbox", Plug.Swoosh.MailboxPreview)
    end
  end

  scope "/", PlatformWeb do
    pipe_through([:browser, :redirect_if_user_is_authenticated, :interstitial])

    get("/users/register", UserRegistrationController, :new)
    post("/users/register", UserRegistrationController, :create)
    get("/users/log_in", UserSessionController, :new)
    post("/users/log_in", UserSessionController, :create)
    get("/users/reset_password", UserResetPasswordController, :new)
    post("/users/reset_password", UserResetPasswordController, :create)
    get("/users/reset_password/:token", UserResetPasswordController, :edit)
    put("/users/reset_password/:token", UserResetPasswordController, :update)
  end

  scope "/", PlatformWeb do
    pipe_through([:browser, :app])

    delete("/users/log_out", UserSessionController, :delete)
    get("/users/confirm", UserConfirmationController, :new)
    post("/users/confirm", UserConfirmationController, :create)
    get("/users/confirm/:token", UserConfirmationController, :edit)
    post("/users/confirm/:token", UserConfirmationController, :update)
  end

  scope "/", PlatformWeb do
    pipe_through([:browser, :require_authenticated_user, :app])

    get("/", PageController, :index)
    get("/users/settings", UserSettingsController, :edit)
    put("/users/settings", UserSettingsController, :update)
    get("/users/settings/confirm_email/:token", UserSettingsController, :confirm_email)

    live_session :default, on_mount: {MountHelperLive, :authenticated} do
      live("/settings", SettingsLive)

      live("/new", NewLive)
      live("/map", MapLive.Index)

      live("/queue", MediaLive.Queue)
      live("/queue/:which", MediaLive.Queue)

      live("/media", MediaLive.Index)
      live("/media/:slug", MediaLive.Show, :show)
      live("/media/:slug/card", MediaLive.Card)
      live("/media/:slug/update/:attribute", MediaLive.Show, :edit)
      live("/media/:slug/upload", MediaLive.Show, :upload)

      live("/profile/:username", ProfilesLive.Show, :show)
      live("/profile/:username/edit", ProfilesLive.Show, :edit)

      live("/subscriptions", SubscriptionsLive)
    end
  end
end
