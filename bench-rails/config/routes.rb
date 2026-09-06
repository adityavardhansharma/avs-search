Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  get "/api/suggestions", to: "suggestions#index"

  root "search#index"
end
