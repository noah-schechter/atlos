defmodule Platform.Mailer do
  use Swoosh.Mailer, otp_app: :platform
  import Swoosh.Email

  alias __MODULE__

  # Delivers the email using the application mailer.
  def deliver(recipient, subject, body) do
    email =
      new()
      |> to(recipient)
      |> from({"Atlos Notification", "noreply@mail.atlos.org"})
      |> subject(subject)
      |> text_body(body)

    with {:ok, _metadata} <- Mailer.deliver(email) do
      {:ok, email}
    end
  end
end
