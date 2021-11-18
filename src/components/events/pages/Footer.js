import React from "react";
import {observer} from "mobx-react";
import {Redirect, useRouteMatch} from "react-router-dom";
import {editStore} from "Stores";
import DetailList from "Components/common/DetailList";
import UrlJoin from "url-join";
import {FileInput, Form, FormActions, Input, InputList, Select, TextArea} from "Components/common/Inputs";
import FooterLinkSpec from "Specs/FooterLink";
import RichText from "Components/common/RichText";

export const FooterLink = observer(() => {
  const match = useRouteMatch();
  const objectId = match.params.eventId;
  const basePath = UrlJoin("info", "footer_links", match.params.footerLinkIndex.toString());

  const footerLink = editStore.Value(objectId, basePath, "");

  if(!footerLink) {
    return <Redirect to={UrlJoin("/events", match.params.eventId, "footer")} />;
  }

  return (
    <Form>
      <div className="form__section">
        <h2 className="form__section__header">
          Footer Link: { footerLink.text }
        </h2>
        <Input label="Text" objectId={objectId} path={basePath} name="text" localize />
        <Select label="Type" objectId={objectId} path={basePath} name="type" options={["URL", "Rich Text", "HTML"]} localize >
          <option value="URL">URL</option>
          <option value="Rich Text">Rich Text</option>
          <option value="HTML">HTML</option>
        </Select>
        <Input label="URL" objectId={objectId} path={basePath} name="url" localize only={() => footerLink.type === "URL"} />
        <RichText label="Content (Rich Text)" objectId={objectId} path={basePath} name="content_rich_text" url localize only={() => footerLink.type === "Rich Text"} />
        <FileInput label="Content (HTML)" objectId={objectId} path={basePath} name="content_html" localize only={() => footerLink.type === "HTML"} extensions={["html"]}/>
        <FormActions
          backLink={UrlJoin("/events", objectId, "footer")}
          removeText="Remove Link"
          removeConfirmationText="Are you sure you want to remove this footer link?"
          Remove={async () => editStore.RemoveValue(objectId, UrlJoin("info", "footer_links"), match.params.footerLinkIndex)}
        />
      </div>
    </Form>
  );
});

export const Footer = observer(() => {
  const match = useRouteMatch();
  const objectId = match.params.eventId;

  const footerLinks = (editStore.Value(objectId, "info", "footer_links") || []);
  return (
    <Form>
      <DetailList
        header="Footer"
        hint="events/footer_links"
        columnNames={["Text", "Type"]}
        columnSizes="1fr 200px"
        items={
          footerLinks.map((linkInfo, index) => ({
            link: UrlJoin("/events", objectId, "footer", index.toString()),
            values: [
              editStore.Value(objectId, UrlJoin("info", "footer_links", index.toString()), "text", {localize: true}),
              editStore.Value(objectId, UrlJoin("info", "footer_links", index.toString()), "type", {localize: true}),
            ]
          }))
        }
        noItemsMessage="No Footer Links Added"
        createText="Add Footer Link"
        Create={() => {
          const footerLink = FooterLinkSpec();
          const newIndex = editStore.AppendListValue(objectId, UrlJoin("info", "footer_links"), footerLink);

          return UrlJoin("/events", objectId, "footer", newIndex.toString());
        }}
        removeText={item => `Are you sure you want to remove ${item.values[0] || "this footer link"}?`}
        Remove={async index => editStore.RemoveValue(objectId, UrlJoin("info", "footer_links"), index)}
      />
      <div className="form__section">
        <Input type="checkbox" label="Show Default Privacy Policy" objectId={objectId} path="info" name="show_privacy_policy" defaultValue={true} localize />
        <Input type="checkbox" label="Show Default Terms of Service" objectId={objectId} path="info" name="show_terms" defaultValue={true} localize />
        <Input type="checkbox" label="Show FAQ" objectId={objectId} path="info" name="show_faq" defaultValue={true} localize />
        <Input type="checkbox" label="Use Custom FAQ" objectId={objectId} path="info" name="show_custom_faq" defaultValue={false} dependsOn="info/show_faq" localize />
        <InputList
          label="Custom FAQ"
          objectId={objectId}
          path="info/faq"
          itemSpec={{question: "", answer: ""}}
          localize
          dependsOn={["info/show_faq", "info/show_custom_faq"]}
          Render={(item, index) =>
            <>
              <TextArea label="Question" objectId={objectId} path={UrlJoin("info", "faq", index.toString())} name="question" localize />
              <TextArea label="Answer" objectId={objectId} path={UrlJoin("info", "faq", index.toString())} name="answer" localize />
            </>
          }
        />
      </div>
    </Form>
  );
});
