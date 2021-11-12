import {GenerateUUID} from "Utils/Misc";

const TicketSKUSpec = () => ({
  uuid: GenerateUUID(),
  label: "<New Ticket SKU>",
  otp_id: "",
  external_url: "",
  start_time: null,
  end_time: null,
  start_time_text: "",
  hidden: false,
  price: {}
});

export default TicketSKUSpec;
