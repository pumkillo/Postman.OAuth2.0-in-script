class ServiceConfig {
  // Initializing variables

  // !Change SERVICE to your service name in client_id and client_secret. Expect: there are defined variables in Enviroment scope
  static env_client_id_name = "SERVICE_CLIENT_ID";
  // !Name of token variable. This variable will be taken from Collection in scope. Expect: the collection is a service of your application
  static token_name = "Token";
  // !Change SERVICE to your service name in client_id and client_secret. Expect: there are defined variables in Enviroment scope
  static env_client_secret_name = "SERVICE_CLIENT_SECRET";
  // !You should define HOST in Enviroment scope
  static host = pm.environment.get("HOST");
  // !You should define REALM in Enviroment scope
  static realm = pm.environment.get("REALM");

  // Get token from collection with defined name
  static get token() {
    if (pm.collectionVariables.get(this.token_name) === undefined) {
      pm.collectionVariables.set(this.token_name, "");
    }
    return pm.collectionVariables.get(this.token_name);
  }

  // Get client_id from env variables
  static get env_client_id() {
    return pm.environment.get(this.env_client_id_name);
  }

  // Get client_secret from env variables
  static get env_client_secret() {
    return pm.environment.get(this.env_client_secret_name);
  }

  // Get request options for token update
  // !Set up your options to access token URL
  static get tokenUpdateOptions() {
    return {
      url: `${this.host}/auth/realms/${this.realm}/your-path-to-get-token`,
      method: "POST",
      header: {
        "Content-Type": "application/x-www-form-urlencoded",
        // OAuth2.0 with Basic Authorization and Client Credentials
        Authorization: `Basic ${btoa(
          `${this.env_client_id}:${this.env_client_secret}`
        )}`,
      },
      body: {
        mode: "urlencoded",
        urlencoded: [{ key: "grant_type", value: "client_credentials" }],
      },
    };
  }

  // Update service token with defined request options in tokenUpdateOptions
  static serviceTokenUpdate() {
    // Set context_token_name to get this.token_name in response handler of pm.sendRequest
    const context_token_name = this.token_name;
    pm.sendRequest(this.tokenUpdateOptions, function (error, response) {
      if (error) {
        console.error(error);
        return error;
      }
      // !Your response format can differ. Change name your token parameter in response
      pm.collectionVariables.set(context_token_name, response.json().token);
    });
  }

  // Set token defined value
  static setToken(value = "") {
    pm.collectionVariables.set(this.token_name, value);
  }

  // Compare Token host with Enviroment host
  static isHostChanged() {
    // !Your host parameter in token can differ. Change name your token parameter "host"
    tokenHost = JSON.parse(atob(this.token.split(".")[1])).host.match(
      /(?:\w+\.)+\w+/gm
    )[0];
    envHost = this.host;
    return envHost.indexOf(tokenHost) == -1;
  }

  // Check is token null or got expired
  static checkToken() {
    // If host token is empty than we should update it without additional check
    if (this.token == "") {
      this.serviceTokenUpdate();
      return;
    }
    // Check date of token expiration date
    let exp =
      new Date(
        JSON.parse(atob(this.token.split(".")[1])).token_expiration_date * 1000
      ) ?? 0;
    // If host has been changed or token got expired then update token
    if (this.isHostChanged() || exp < Date.now()) {
      this.serviceTokenUpdate();
    }
  }
}

ServiceConfig.checkToken();
