import {observer} from "mobx-react";
import {Link} from "react-router-dom";
import Confirm from "Components/common/Confirm";
import ImageIcon from "Components/common/ImageIcon";
import DeleteIcon from "Assets/icons/x-square";
import React from "react";

const DetailList = observer(
  ({
    header,
    columnNames,
    columnClasses=[],
    columnSizes="1fr",
    items,
    noItemsMessage="No Items Available",
    createText="Create Item",
    Create,
    Remove
  }) => {
    const rowStyle = { gridTemplateColumns: columnSizes + " 50px" };
    return (
      <>
        <h2 className="page-header">
          { header }
        </h2>
        <div className="actions-container">
          <button className="action action-primary" onClick={Create}>{ createText }</button>
        </div>
        {
          items.length === 0 ?
            <div className="detail-list__empty">
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
                            message: "Are you sure you want to delete this item?",
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
