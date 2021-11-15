import React from "react";
import {observer} from "mobx-react";
import {Form, Input} from "Components/common/Inputs";
import {useRouteMatch} from "react-router-dom";

const BasicInfo = observer(() => {
  const match = useRouteMatch();
  const objectId = match.params.eventId;

  return (
    <Form>
      <div className="form__section">
        <h2 className="form__section__header">
          Basic Info
        </h2>
        <Input label="Event Name" objectId={objectId} path="" name="display_title" localize />
      </div>
    </Form>
  );
});

export default BasicInfo;
