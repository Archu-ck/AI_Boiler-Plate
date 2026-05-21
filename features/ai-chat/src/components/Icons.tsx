import {
  MessageSquare,
  Plus,
  Trash2,
  Sun,
  Moon,
  ChevronDown,
  Send,
  Square,
  Copy,
  Check,
  Search,
  X,
  ArrowRight,
  Terminal,
  Sparkles,
  FileText,
  Lightbulb,
  CornerUpLeft,
  Menu,
} from 'lucide-react';
import React from 'react';

// Wrapper to force Apple SF Symbols feel (18px, 1.5 stroke)
const withStyles = (IconComponent: React.ComponentType<any>) => {
  return function StyledIcon(props: any) {
    return <IconComponent size={props.size || 18} strokeWidth={props.strokeWidth || 1.5} {...props} />;
  };
};

export const Icons = {
  MessageSquare: withStyles(MessageSquare),
  Plus: withStyles(Plus),
  Trash2: withStyles(Trash2),
  Sun: withStyles(Sun),
  Moon: withStyles(Moon),
  ChevronDown: withStyles(ChevronDown),
  Send: withStyles(Send),
  Square: withStyles(Square),
  Copy: withStyles(Copy),
  Check: withStyles(Check),
  Search: withStyles(Search),
  X: withStyles(X),
  ArrowRight: withStyles(ArrowRight),
  Terminal: withStyles(Terminal),
  Sparkles: withStyles(Sparkles),
  FileText: withStyles(FileText),
  Lightbulb: withStyles(Lightbulb),
  CornerUpLeft: withStyles(CornerUpLeft),
  Menu: withStyles(Menu),
};
