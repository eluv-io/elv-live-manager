import {GenerateUUID} from "Utils/Misc";

const TicketClassSpec = () => ({
  uuid: GenerateUUID(),
  name: "<New Ticket Class>",
  description: "",
  release_date: null,
  image: null,
  hidden: false,
  requires_shipping: false,
  skus: []
});

export default TicketClassSpec;
