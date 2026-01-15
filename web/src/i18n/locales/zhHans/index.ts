import common from "./common";
import conversation from "./conversation";
import settings from "./settings";
import voice from "./voice";

const zhHans = {
  ...common,
  ...conversation,
  ...settings,
  ...voice,
};

export default zhHans;
