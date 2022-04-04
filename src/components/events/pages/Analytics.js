import React from "react";
import {observer} from "mobx-react";
import {FileInput, Form, Input, InputList, Select, TextArea} from "Components/common/Inputs";
import {useRouteMatch} from "react-router-dom";
import UrlJoin from "url-join";

const Analytics = observer(() => {
  const match = useRouteMatch();
  const objectId = match.params.eventId;

  return (
    <Form>
      <div className="form__section">
        <h2 className="form__section__header">
          Analytics
        </h2>

        <InputList
          label="Analytics Groups"
          objectId={objectId}
          path="info/analytics"
          Render={(item, groupIndex) =>
            <>
              <Input label="Group Label" objectId={objectId} path={UrlJoin("info", "analytics", groupIndex.toString())} name="label" />
              <InputList
                label="Analytics Ids"
                objectId={objectId}
                path={UrlJoin("info", "analytics", groupIndex.toString(), "ids")}
                Render={(item, idIndex) =>
                  <>
                    <Select label="Type" objectId={objectId} path={UrlJoin("info", "analytics", groupIndex.toString(), "ids", idIndex.toString())} name="type">
                      <option value={"Google Analytics ID"}>Google Analytics ID</option>
                      <option value={"Google Tag Manager ID"}>Google Tag Manager ID</option>
                      <option value={"Google Conversion ID"}>Google Conversion ID</option>
                      <option value={"Google Conversion Label"}>Google Conversion Label</option>
                      <option value={"Facebook Pixel ID"}>Facebook Pixel ID</option>
                      <option value={"App Nexus Segment ID"}>App Nexus Segment ID</option>
                      <option value={"App Nexus Pixel ID"}>App Nexus Pixel ID</option>
                      <option value={"TradeDoubler Organization ID"}>TradeDoubler Organization ID</option>
                      <option value={"TradeDoubler Event ID"}>TradeDoubler Event ID</option>
                    </Select>

                    <Input label="ID" objectId={objectId} path={UrlJoin("info", "analytics", groupIndex.toString(), "ids", idIndex.toString())} name="id" />
                  </>
                }
              />
            </>
          }
        />
      </div>
    </Form>
  );
});

export default Analytics;

/*
{
  "name": "analytics_ids",
  "label": "Analytics IDs",
  "type": "list",
  "no_localize": true,
  "hint": "Specify IDs for your own analytics",
  "fields": [
  {
    "name": "label",
    "type": "text",
    "hint": "A label for this collection of analytics"
  },
  {
    "name": "ids",
    "label": "IDs",
    "type": "list",
    "fields": [
      {
        "name": "type",
        "type": "select",
        "options": [
          "Google Analytics ID",
          "Google Tag Manager ID",
          "Google Conversion ID",
          "Google Conversion Label",
          "Facebook Pixel ID",
          "App Nexus Segment ID",
          "App Nexus Pixel ID",
          "TradeDoubler Organization ID",
          "TradeDoubler Event ID",
        ]
      },
      {
        "name": "id",
        "label": "ID",
        "type": "text"
      }
    ]
  }
}


{
  "fields": [
  {
    "name": "name",
    "type": "text"
  },
  {
    "name": "description",
    "type": "textarea"
  },
  {
    "name": "location",
    "type": "text"
  },
  {
    "name": "type",
    "type": "select",
    "options": ["Online Only", "Online and In-Person"]
  },
  {
    "name": "images",
    "type": "list",
    "fields": [{
      "name": "image",
      "type": "file",
      "extensions": imageTypes
    }]
  },
  {
    "name": "performers",
    "type": "list",
    "fields": [
      {
        "name": "name",
        "type": "text"
      },
      {
        "name": "url",
        "label": "URL",
        "type": "text"
      },
      {
        "name": "image",
        "type": "file",
        "extensions": imageTypes
      }
    ]
  },
  {
    "name": "organizers",
    "type": "list",
    "fields": [
      {
        "name": "name",
        "type": "text"
      },
      {
        "name": "url",
        "label": "URL",
        "type": "text"
      },
      {
        "name": "image",
        "type": "file",
        "extensions": imageTypes
      }
    ]
  },
  {
    "name": "showings",
    "type": "list",
    "fields": [
      {
        "name": "name",
        "type": "text"
      },
      {
        "name": "start_time",
        "type": "datetime",
        "hint": "Make sure this time exactly matches the corresponding ticket SKU start times"
      },
      {
        "name": "end_time",
        "type": "datetime"
      }
    ]
  }
],
  "label": "Search Listing Info",
  "name": "search_data",
  "type": "subsection",
  "hint": "This information will be used to populate data used by search engines for displaying this event",
  "no_localize": true
},
{
  "name": "analytics_ids",
  "label": "Analytics IDs",
  "type": "list",
  "no_localize": true,
  "hint": "Specify IDs for your own analytics",
  "fields": [
  {
    "name": "label",
    "type": "text",
    "hint": "A label for this collection of analytics"
  },
  {
    "name": "ids",
    "label": "IDs",
    "type": "list",
    "fields": [
      {
        "name": "type",
        "type": "select",
        "options": [
          "Google Analytics ID",
          "Google Tag Manager ID",
          "Google Conversion ID",
          "Google Conversion Label",
          "Facebook Pixel ID",
          "App Nexus Segment ID",
          "App Nexus Pixel ID",
          "TradeDoubler Organization ID",
          "TradeDoubler Event ID",
        ]
      },
      {
        "name": "id",
        "label": "ID",
        "type": "text"
      }
    ]
  }
]
}
]

 */
