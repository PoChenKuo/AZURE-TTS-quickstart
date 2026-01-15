import common from "./common";
import conversation from "./conversation";
import settings from "./settings";
import voice from "./voice";

const zhHant = {
  ...common,
  ...conversation,
  ...settings,
  ...voice,
};

export default zhHant;
