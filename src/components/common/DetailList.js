import {observer} from "mobx-react";
import {Link, Redirect} from "react-router-dom";
import Confirm from "Components/common/Confirm";
import ImageIcon from "Components/common/ImageIcon";
import DeleteIcon from "Assets/icons/x-square";
import React, {useState} from "react";
import {SafeTraverse} from "Utils/Misc";
import Hints from "Assets/documentation/InputHints.yaml";
import ToolTip from "Components/common/ToolTip";
import HintIcon from "Assets/icons/help-square";

const DetailList = observer(
  ({
    header,
    hint,
    columnNames,
    columnClasses=[],
    columnSizes="1fr",
    items,
    noItemsMessage="No Items Available",
    createText="Create Item",
    Create,
    removeText="Are you sure you want to remove this item?",
    Remove
  }) => {
    const [redirect, setRedirect] = useState(undefined);

    if(redirect) {
      return <Redirect to={redirect} />;
    }

    if(hint) {
      hint = SafeTraverse(Hints, hint);
    }

    const rowStyle = { gridTemplateColumns: columnSizes + " 50px" };
    return (
      <>
        <h2 className="detail-list__header">
          { header }
        </h2>
        <div className="actions-container">
          <button className="action action-primary" onClick={() => setRedirect(Create)}>{ createText }</button>
          {
            hint ?
              <ToolTip className="hint" content={<pre className="labelled-field__hint-content">{ hint }</pre>}>
                <ImageIcon
                  alt={hint}
                  icon={HintIcon}
                  className="labelled-field__hint"
                />
              </ToolTip> : null
          }
        </div>
        {
          items.length === 0 ?
            <div className="detail-list detail-list__empty">
              { noItemsMessage }
            </div> :
            <div className="detail-list tickets-list">
              <div className="detail-list__item-header" style={rowStyle}>
                { columnNames.map((name, index) =>
                  <div className={`detail-list__item__column ${columnClasses[index] || ""}`} key={`column-header-${name}`}>{ name }</div>
                )}
              </div>
              {
                items.map((item, itemIndex) =>
                  <Link
                    to={item.link}
                    key={`ticket-class-${itemIndex}`}
                    className="detail-list__item"
                    style={rowStyle}
                  >
                    { item.values.map((value, valueIndex) =>
                      <div className={`detail-list__item__column ${columnClasses[valueIndex] || ""}`} key={`item-value-${itemIndex}-${valueIndex}`}>{ value }</div>
                    )}
                    <div className="detail-list__item__column detail-list__item__column-actions">
                      <button
                        className="action action-icon"
                        onClick={async event => {
                          event.preventDefault();
                          event.stopPropagation();

                          await Confirm({
                            message: typeof removeText === "function" ? removeText(item) : removeText,
                            Confirm: async () => await Remove(itemIndex)
                          });
                        }}
                      >
                        <ImageIcon
                          title="Delete item"
                          className="action-icon__icon"
                          icon={DeleteIcon}
                        />
                      </button>
                    </div>
                  </Link>
                )
              }
            </div>
        }
      </>
    );
  }
);

export default DetailList;
