import { Breadcrumb } from "./Breadcrumb";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { Form, FormError, FormLabel } from "./Forms";
import { GradientText } from "./GradientText";
import { Input } from "./Input";
import { Menu } from "./MenuTheme";
import { Modal } from "./Modal";
import { NumberInput } from "./NumberInput";
import { Radio } from "./Radio";
import { Switch } from "./Switch";
import { tabs } from "./Tabs";
import { Text } from "./Text";
import { Textarea } from "./Textarea";
import { tooltip } from "./Tooltip";

export function components() {
  const Tabs = tabs();
  const Tooltip = tooltip();

  const component = {
    NumberInput,
    Input,
    Textarea,
    Button,
    Checkbox,
    Switch,
    Tabs,
    Radio,
    Form,
    FormError,
    FormLabel,
    Modal,
    Menu,
    Breadcrumb,
    Tooltip,
    Text,
    GradientText,
  };
  return component;
}
