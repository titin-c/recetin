import type { LucideIcon, LucideProps } from "lucide-react";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  Circle,
  CircleAlert,
  Clock,
  House,
  Info,
  KeyRound,
  List,
  Ban,
  Trash2,
  Eye,
  LoaderCircle,
  LogOut,
  Mail,
  Search,
  Shield,
  ShoppingCart,
  User,
  Users,
  X,
} from "lucide-react";

/**
 * Iconos del design system: solo de línea, 1 px constante a cualquier tamaño (paso 7).
 * Junto a texto son decorativos (aria-hidden); si un icono va solo, el botón que lo
 * contiene debe llevar aria-label.
 */
function line(Icon: LucideIcon) {
  function LineIcon({ size = 20, ...props }: LucideProps) {
    return <Icon size={size} strokeWidth={1} absoluteStrokeWidth aria-hidden="true" focusable="false" {...props} />;
  }
  LineIcon.displayName = `Icon(${Icon.displayName ?? "lucide"})`;
  return LineIcon;
}

export const Icon = {
  alert: line(CircleAlert),
  info: line(Info),
  close: line(X),
  check: line(Check),
  pending: line(Circle),
  mail: line(Mail),
  clock: line(Clock),
  home: line(House),
  chevronDown: line(ChevronDown),
  logout: line(LogOut),
  book: line(BookOpen),
  search: line(Search),
  calendar: line(CalendarDays),
  cart: line(ShoppingCart),
  user: line(User),
  users: line(Users),
  shield: line(Shield),
  key: line(KeyRound),
  back: line(ArrowLeft),
  spinner: line(LoaderCircle),
  list: line(List),
  ban: line(Ban),
  trash: line(Trash2),
  eye: line(Eye),
};
