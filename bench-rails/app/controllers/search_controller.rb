# frozen_string_literal: true

require_relative "../../lib/engines_data"

class SearchController < ApplicationController
  def index
    @engines = ENGINES
    # Long-lived HTML, short-lived API: the page itself rarely changes.
    response.headers["Cache-Control"] = "public, max-age=3600, s-maxage=86400"
  end
end
