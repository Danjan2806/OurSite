import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft, faEye, faEyeSlash, faGlobe, faPlus, faGear, faTrash, faChevronUp, faChevronDown,
  faGripVertical, faFont, faImage, faBagShopping, faBolt, faChartBar, faUsers,
  faCommentDots, faVideo, faMusic, faCalendar, faPhone, faFileLines, faCircleQuestion,
  faStar, faTableColumns, faLayerGroup, faCheck, faDesktop, faTabletScreenButton,
  faMobileScreenButton, faChevronRight, faGrip, faGripLines, faExpand, faXmark,
  faShield, faPenToSquare, faMagnifyingGlass, faRotate, faDatabase, faServer,
  faWaveSquare, faCrown, faCubes, faTriangleExclamation, faCircleCheck,
  faGaugeHigh, faBookOpen, faUser, faCreditCard, faCode, faCircleExclamation,
  faChevronLeft, faBars, faSpinner, faCircle, faMinus, faEllipsis,
  faArrowRight, faSliders, faBell, faEnvelope, faLock,
  faLocationDot, faHashtag, faCopy, faInbox, faPaperPlane,
  faRotateLeft, faRotateRight, faWindowMaximize,
  faLink, faArrowUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

type IconProps = {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: unknown;
};

function makeIcon(icon: IconDefinition) {
  const Comp = ({ size = 16, className = "", style, ..._ }: IconProps) => (
    <FontAwesomeIcon icon={icon} style={{ width: size, height: size, ...style }} className={className} />
  );
  Comp.displayName = icon.iconName;
  return Comp;
}

export const ArrowLeft = makeIcon(faArrowLeft);
export const ArrowRight = makeIcon(faArrowRight);
export const Eye = makeIcon(faEye);
export const EyeOff = makeIcon(faEyeSlash);
export const Globe = makeIcon(faGlobe);
export const Plus = makeIcon(faPlus);
export const Settings2 = makeIcon(faGear);
export const Trash2 = makeIcon(faTrash);
export const ChevronUp = makeIcon(faChevronUp);
export const ChevronDown = makeIcon(faChevronDown);
export const ChevronRight = makeIcon(faChevronRight);
export const ChevronLeft = makeIcon(faChevronLeft);
export const GripVertical = makeIcon(faGripVertical);
export const Type = makeIcon(faFont);
export const Image = makeIcon(faImage);
export const ShoppingBag = makeIcon(faBagShopping);
export const Zap = makeIcon(faBolt);
export const BarChart2 = makeIcon(faChartBar);
export const Users = makeIcon(faUsers);
export const MessageSquare = makeIcon(faCommentDots);
export const Video = makeIcon(faVideo);
export const Music = makeIcon(faMusic);
export const Calendar = makeIcon(faCalendar);
export const Phone = makeIcon(faPhone);
export const FileText = makeIcon(faFileLines);
export const HelpCircle = makeIcon(faCircleQuestion);
export const Star = makeIcon(faStar);
export const Layout = makeIcon(faTableColumns);
export const Layers = makeIcon(faLayerGroup);
export const Check = makeIcon(faCheck);
export const Monitor = makeIcon(faDesktop);
export const Tablet = makeIcon(faTabletScreenButton);
export const Smartphone = makeIcon(faMobileScreenButton);
export const LayoutTemplate = makeIcon(faGrip);
export const SplitSquareHorizontal = makeIcon(faTableColumns);
export const Rows = makeIcon(faGripLines);
export const Maximize2 = makeIcon(faExpand);
export const X = makeIcon(faXmark);
export const Shield = makeIcon(faShield);
export const Edit2 = makeIcon(faPenToSquare);
export const Search = makeIcon(faMagnifyingGlass);
export const RefreshCw = makeIcon(faRotate);
export const Database = makeIcon(faDatabase);
export const Server = makeIcon(faServer);
export const Activity = makeIcon(faWaveSquare);
export const Crown = makeIcon(faCrown);
export const Package = makeIcon(faCubes);
export const AlertTriangle = makeIcon(faTriangleExclamation);
export const CheckCircle = makeIcon(faCircleCheck);
export const LayoutDashboard = makeIcon(faGaugeHigh);
export const BookOpen = makeIcon(faBookOpen);
export const User = makeIcon(faUser);
export const CreditCard = makeIcon(faCreditCard);
export const Code = makeIcon(faCode);
export const AlertCircle = makeIcon(faCircleExclamation);
export const PanelLeftIcon = makeIcon(faBars);
export const Loader2Icon = makeIcon(faSpinner);
export const Circle = makeIcon(faCircle);
export const Minus = makeIcon(faMinus);
export const MoreHorizontal = makeIcon(faEllipsis);
export const Sliders = makeIcon(faSliders);
export const Bell = makeIcon(faBell);
export const Mail = makeIcon(faEnvelope);
export const Lock = makeIcon(faLock);
export const MapPin = makeIcon(faLocationDot);
export const Code2 = makeIcon(faCode);
export const Hash = makeIcon(faHashtag);
export const Copy = makeIcon(faCopy);
export const Inbox = makeIcon(faInbox);
export const Send = makeIcon(faPaperPlane);
export const Undo2 = makeIcon(faRotateLeft);
export const Redo2 = makeIcon(faRotateRight);
export const LinkIcon = makeIcon(faLink);
export const ArrowSquareOut = makeIcon(faArrowUpRightFromSquare);
export const PopupIcon = makeIcon(faWindowMaximize);
