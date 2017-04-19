[![Slack Status](http://slack.sparkpost.com/badge.svg)](http://slack.sparkpost.com)

This is a SendGrid to SparkPost email template migration tool.
It supports translation of SendGrid's Handlebars syntax into equivalent SparkPost syntax.

The tool presents a simple web UI for migrating templates directly from your sendgrid account to SparkPost as well as translating sendgrid template text directly into its SparkPost equivalent.

If you want to automate your migration, the tool also has an API.

See below for details on [deployment on Heroku](#heroku-deployment), [manual deployment](#manual-deployment) and [API use](#the-api).

## Supported Features
- <%subject%>, <%body%>
- Sender Info
- [Weblink]
- [%email%]
- [%custom_field%], [%custom_field | default value%]

## Unsupported Features
- <%asm_global_unsubscribe_url%>
- [Unsubscribe]
- _User delimited variables_
You need provide the names of the custom delimited variables during translation. Only one type of delimiter is supported. 

## Heroku Deployment

You can deploy it directly to Heroku: [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

## Manual Deployment

If you prefer you can deploy it into your own environment using the instructions below.

### Prerequisites

 - node 6.0+
 - npm 3.0+

```bash
git clone --recursive https://github.com/SparkPost/sendgrid-sparkpost-templates.git
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

### /api/translate: Template Translation

Accept a SendGrid template and convert it SparkPost format.

Request:

```
POST /api/translate HTTP/1.1
Content-Type: application/json

{
  "sendgridTemplate": "..."
}
```

Successful response:

```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "sparkPostTemplate": "..."
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
  "sendgridAPIKey": "...",
  "sendgridTemplateName": "...",
  "sparkPostAPIKey": "..."
}
```

Successful response:

```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "result": true
}
```

### Contributing

We *welcome* your contributions.  Check out our [contributor notes](CONTRIBUTING.md) for details on how to help out.

### ChangeLog

[See ChangeLog here](CHANGELOG.md)
