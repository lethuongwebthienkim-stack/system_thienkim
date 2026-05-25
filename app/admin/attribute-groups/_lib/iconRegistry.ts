'use client';

import type React from 'react';
import {
  // Food & Wine
  Wine, Beer, GlassWater, Utensils, UtensilsCrossed, ChefHat, Cake, Coffee, Pizza, Cookie,
  // General UI & Actions
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Check, X, Plus, Minus, Edit, Trash, Settings, Search, Bell, Mail, Lock, Unlock, Eye, EyeOff, User, Users, Globe, MapPin, Phone, Calendar, Heart, Star, Bookmark, Share2, Link, RefreshCw, Loader2, HelpCircle, Info, AlertTriangle, AlertCircle, Sparkles, Flame, Shield,
  // Media & Files
  File, Folder, Image, Video, Music, Headphones, Book, GraduationCap, Trophy, Gift,
  // Commerce & Business
  ShoppingBag, ShoppingCart, CreditCard, Tag, Landmark, Wallet, Banknote, Briefcase, Building, Building2, Clipboard, HardDrive,
  // Tech & Devices
  Cpu, Database, Laptop, Smartphone, Tablet, Watch, Wifi, Power, Play, Pause, Square, Circle, Triangle,
  // Icons from about Form
  Activity, AirVent, AlarmClock, Ambulance, Anchor, Aperture, Armchair, Award, Camera, ChartColumn, Compass, Crosshair, Crown, Diamond, FileCheck2, FileText, Fingerprint, Flag, Gem, HandCoins, HeartHandshake, Home, KeyRound, Layers, Leaf, LifeBuoy, Lightbulb, Megaphone, MessagesSquare, MonitorSmartphone, Package, Palette, PenTool, Receipt, Rocket, ScanSearch, Send, Server, ShieldCheck, Store, Target, Truck, UserCheck, WandSparkles, Wrench, Zap,
  // Extra UI & Nature
  Smile, Frown, Languages, CheckCircle2, XCircle, Clock, CheckSquare, SquareDot, Badge, BadgeCheck, BadgeAlert, Grid, List, Compass as CompassIcon, Navigation, Route, Map, Plane, Car, Bike, Ship, Umbrella, Sun, Moon, Cloud, Snowflake, Wind, Droplets, Flower, TreePine, Mountain, Scissors, Brush, Scale, Hammer, Key, Pin,
  // Wine / Alcohol Related extras
  Grape, GlassWater as Cocktail, GlassWater as WineGlass, Flame as HighAlcohol, ShieldAlert,
} from 'lucide-react';

export const ATTRIBUTE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  Wine, Beer, GlassWater, Utensils, UtensilsCrossed, ChefHat, Cake, Coffee, Pizza, Cookie,
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Check, X, Plus, Minus, Edit, Trash, Settings, Search, Bell, Mail, Lock, Unlock, Eye, EyeOff, User, Users, Globe, MapPin, Phone, Calendar, Heart, Star, Bookmark, Share2, Link, RefreshCw, Loader2, HelpCircle, Info, AlertTriangle, AlertCircle, Sparkles, Flame, Shield,
  File, Folder, Image, Video, Music, Headphones, Book, GraduationCap, Trophy, Gift,
  ShoppingBag, ShoppingCart, CreditCard, Tag, Landmark, Wallet, Banknote, Briefcase, Building, Building2, Clipboard, HardDrive,
  Cpu, Database, Laptop, Smartphone, Tablet, Watch, Wifi, Power, Play, Pause, Square, Circle, Triangle,
  Activity, AirVent, AlarmClock, Ambulance, Anchor, Aperture, Armchair, Award, Camera, ChartColumn, Compass, Crosshair, Crown, Diamond, FileCheck2, FileText, Fingerprint, Flag, Gem, HandCoins, HeartHandshake, Home, KeyRound, Layers, Leaf, LifeBuoy, Lightbulb, Megaphone, MessagesSquare, MonitorSmartphone, Package, Palette, PenTool, Receipt, Rocket, ScanSearch, Send, Server, ShieldCheck, Store, Target, Truck, UserCheck, WandSparkles, Wrench, Zap,
  Smile, Frown, Languages, CheckCircle2, XCircle, Clock, CheckSquare, SquareDot, Badge, BadgeCheck, BadgeAlert, Grid, List, CompassIcon, Navigation, Route, Map, Plane, Car, Bike, Ship, Umbrella, Sun, Moon, Cloud, Snowflake, Wind, Droplets, Flower, TreePine, Mountain, Scissors, Brush, Scale, Hammer, Key, Pin,
  Grape, Cocktail, WineGlass, HighAlcohol, ShieldAlert,
};

export const ATTRIBUTE_ICON_OPTIONS = Object.keys(ATTRIBUTE_ICONS).map((name) => ({
  value: name,
  label: name,
  Icon: ATTRIBUTE_ICONS[name] || Star,
}));

export const getAttributeIconComponent = (name?: string) => {
  return ATTRIBUTE_ICONS[name ?? ''] || Star;
};
