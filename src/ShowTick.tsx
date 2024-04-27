import { Cross, Tick } from "./assets/Image";
import Styles from "./style.module.css";

function ShowTick({
  ValueByKey,
  policyMessage = ValueByKey ? "Policy passed" : "Policy failed",
}: {
  ValueByKey: Boolean;
  policyMessage?: string;
}) {
  return (
    <div
      className={`${Styles.policy_message_section} ${
        ValueByKey
          ? Styles.policy_message_section_success
          : Styles.policy_message_section_error
      }`}
    >
      {ValueByKey ? <Tick /> : <Cross />} {policyMessage}
    </div>
  );
}

export default ShowTick;
