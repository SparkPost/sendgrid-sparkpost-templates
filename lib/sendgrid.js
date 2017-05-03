'use strict';

const _ = require('lodash')
  , sendgrid = require('sendgrid');

function getSenderDetails(apiKey, senderId) {
  let client = sendgrid(apiKey),
    request = client.emptyRequest({
      method: 'GET',
      path: `/v3/senders/${senderId}`
    });

  return client.API(request)
    .then(response => {
      return response.body;
    })
    .catch(error => {
      throw new {
        name: 'SendGridError',
        message: error.message,
        error: error
      };
    });
}

function extractTransactionalTemplate(apiKey, _id) {
  let client = sendgrid(apiKey),
    request = client.emptyRequest({
      method: 'GET',
      path: `/v3/templates/${_id}`
    });

  return client.API(request)
    .then(response => {
      let data = _.first(_.filter(response.body.versions, (version) => {
        return version.active === 1
      }));


      if (!data) {
        throw new Error('No active version of template found');
      }

      return {
        id: data.id,
        name: data.name,
        html: data.html_content,
        text: data.plain_content,
        subject: data.subject
      }
    })
    .catch(error => {
      throw {
        name: 'SendGridError',
        message: error.message,
        error: error
      };
    });

}

function extractCampaignTemplate(apiKey, _id) {
  let client = sendgrid(apiKey),
    request = client.emptyRequest({
      method: 'GET',
      path: `/v3/campaigns/${_id}`
    });

  return client.API(request)
    .then(response => {
      let campaignData = response.body;

      return getSenderDetails(apiKey, campaignData.sender_id)
        .then((senderData) => {
          return {
            id: campaignData.id,
            name: campaignData.title,
            html: campaignData.html_content,
            text: campaignData.plain_content,
            subject: campaignData.subject,
            from: senderData.from,
            replyTo: senderData.reply_to
          }
        });

    })
    .catch(error => {
      throw {
        name: 'SendGridError',
        message: error.message,
        error: error
      };
    });
}


function extractTemplate(apiKey, _id, isCampaign) {
  if (isCampaign) {
    return extractCampaignTemplate(apiKey, _id);
  } else {
    return extractTransactionalTemplate(apiKey, _id);
  }
}

module.exports = {
  extractTemplate: extractTemplate,
};

