[![Slack Status](http://slack.sparkpost.com/badge.svg)](http://slack.sparkpost.com)

This is a SendGrid to SparkPost email template migration tool.

The tool presents a simple web UI for migrating templates directly from your SendGrid account to SparkPost as well as translating SendGrid template text directly into its SparkPost equivalent.

If you want to automate your migration, the tool also has an API.

See below for details on [deployment on Heroku](#heroku-deployment), [manual deployment](#manual-deployment) and [API use](#the-api).

## Transactional Templates

| Supported 	                        | Unsupported 	                      |
|:------------------------------------|:----------------------------- 	    |
| `<%subject%>`              	        | `<%asm_group_unsubscribe_url%>`
| `<%body%>` 	                        | `<%asm_preferences_url%>`
| `<%asm_global_unsubscribe_url%>`*   | Sections |
| Custom delimited variables**   | |


## Marketing Campaigns

| Supported 	                        | Unsupported 	                      |
|:------------------------------------|:----------------------------- 	    |
|Sender Fields <br/> `[Sender_Name], [Sender_Address], [Sender_City], [Sender_State],[Sender_Zip]` | `[Unsubscribe_Preferences]`
|`[Unsubscribe]*`                      | |
|`[Weblink]`                          | |
|`[%email%]`                          | |
|<code>[%custom_field%]`, `[%custom_field &#124; default value%]</code> | |

\* You need to replace placeholder (`?`) after translation.

\** You need specify the custom delimiters during translation. Only one type of delimiter is supported.


## Heroku Deployment

You can deploy it directly to Heroku: [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

### Optional: SparkPost Add-On

If you run this app on Heroku but do not yet have a SparkPost account, you could choose the [SparkPost Heroku add-on](https://elements.heroku.com/addons/sparkpost).
Follow the usual steps through your Heroku dashboard or using the `heroku` command line tool to install the add-on on your Heroku app.

## Manual Deployment

If you prefer you can deploy it into your own environment using the instructions below.

### Prerequisites

 - node 6.0+
 - npm 3.0+

```bash
git clone https://github.com/SparkPost/sendgrid-sparkpost-templates.git
cd sendgrid-sparkpost-templates
npm install
npm run start
```

You now have a server running on port 3000.

## Usage

### The UI

Once deployed, you can migrate templates between services or translate template text directly through the web UI.

### The API

If you prefer direct API access or you want to automate your template migration, here's how the API endpoints work.

### /api/translate: Template Translation

Accept a SendGrid template and convert it SparkPost format.

Request:

```
POST /api/translate HTTP/1.1
Content-Type: application/json

sendgridTemplate: "SendGrid template content",
options: {
  isCampaign: false,
  startingDelimiter: "%",
  endingDelimiter: "%"
}

```

Successful response:

```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "sparkPostTemplate": "Translated template content",
  "warnings": [
    "<%asm_group_unsubscribe_url%> is unsupported. Treating a normal substitution variable."
  ]
}
```

### /api/migrate: Migration From SendGrid To SparkPost

Extract a template from sendgrid, translate it and import it into SparkPost.

Note: your SparkPost API key must include Templates Read/Write privileges for use with the `migrate` endpoint and the migration UI.

Request:

```
POST /api/migrate HTTP/1.1
Content-Type: application/json

{
  sendgridAPIKey: "your-sendgrid-api-key",
  sendgridTemplateId: "your-sendgrid-template-or-campaign-id",
  sparkPostAPIKey: "your-sparkpost-api-key",
  options: {
    useHerokuSPAPIKey: false,
    isSendgridCampaign: true,
    useSandboxDomain: true,
    startingDelimiter: "%"
    endingDelimiter: "%"
  }
}

```

Successful response:

```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "result": true,
  "warnings": [
    "<%asm_group_unsubscribe_url%> is unsupported. Treating a normal substitution variable."
  ]
}
```

### API Errors

On error, the API endpoints will return a non-200 status code and a JSON error object containing a list of errors:

```json
{
  "errors": [
    {"message": "Description of a thing that did not work."},
    {"message": "..."}
  ]
}
```

### Contributing

We *welcome* your contributions.  Check out our [contributor notes](CONTRIBUTING.md) for details on how to help out.

### ChangeLog

[See ChangeLog here](CHANGELOG.md)
