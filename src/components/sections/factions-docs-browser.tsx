"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  Search,
  Settings2,
  ShieldAlert,
  TerminalSquare,
} from "lucide-react";

type DocBlock =
  | { type: "paragraph"; text: string }
  | { type: "callout"; title: string; text: string }
  | { type: "list"; items: string[] }
  | { type: "steps"; items: string[] }
  | { type: "table"; columns: string[]; rows: string[][] }
  | { type: "cards"; items: { title: string; body: string; meta?: string }[] }
  | { type: "commands"; groups: { title: string; items: { command: string; description: string; permission?: string }[] }[] }
  | { type: "code"; language?: string; code: string };

type DocSection = {
  slug: string;
  title: string;
  description: string;
  blocks: DocBlock[];
};

type DocGroup = {
  title: string;
  icon: typeof BookOpen;
  sections: DocSection[];
};

const commandGroups = [
  {
    title: "Faction basics",
    items: [
      { command: "/f help", description: "Open the command help menu.", permission: "factions.help" },
      { command: "/f create <name>", description: "Create a new faction.", permission: "factions.create" },
      { command: "/f join <faction>", description: "Join an open faction or accepted invite.", permission: "factions.join" },
      { command: "/f leave", description: "Leave your current faction.", permission: "factions.leave" },
      { command: "/f show [faction]", description: "View faction profile, members, power, and status.", permission: "factions.show" },
      { command: "/f list", description: "Browse factions on the server.", permission: "factions.list" },
      { command: "/f disband [faction]", description: "Disband your faction or a target faction with staff access.", permission: "factions.disband" },
    ],
  },
  {
    title: "Members and roles",
    items: [
      { command: "/f invite <player>", description: "Invite a player to your faction.", permission: "factions.invite" },
      { command: "/f deinvite <player>", description: "Revoke an invite.", permission: "factions.deinvite" },
      { command: "/f kick <player>", description: "Remove a member from the faction.", permission: "factions.kick" },
      { command: "/f promote <player>", description: "Promote a member role.", permission: "factions.promote" },
      { command: "/f demote <player>", description: "Demote a member role.", permission: "factions.demote" },
      { command: "/f title <player> <title>", description: "Set a member title.", permission: "factions.title" },
      { command: "/f roster", description: "Open or manage faction roster tools.", permission: "factions.roster" },
      { command: "/f alts", description: "Manage alt account controls where enabled.", permission: "factions.alts" },
    ],
  },
  {
    title: "Territory",
    items: [
      { command: "/f claim", description: "Claim the chunk you are standing in.", permission: "factions.claim" },
      { command: "/f unclaim", description: "Unclaim current territory.", permission: "factions.unclaim" },
      { command: "/f autoclaim", description: "Toggle automatic claiming while moving.", permission: "factions.autoclaim" },
      { command: "/f map", description: "View nearby territory.", permission: "factions.map" },
      { command: "/f mapheight <height>", description: "Adjust map display height.", permission: "factions.mapheight" },
      { command: "/f claims", description: "Use advanced claim tools such as radius, fill, corners, and buffers.", permission: "factions.claims" },
    ],
  },
  {
    title: "Homes, warps, vaults",
    items: [
      { command: "/f sethome", description: "Set faction home.", permission: "factions.sethome" },
      { command: "/f home", description: "Teleport to faction home.", permission: "factions.home" },
      { command: "/f warp", description: "Open or use faction warps.", permission: "factions.warp" },
      { command: "/f setwarp <name>", description: "Create a faction warp.", permission: "factions.setwarp" },
      { command: "/f delwarp <name>", description: "Delete a faction warp.", permission: "factions.delwarp" },
      { command: "/f vault", description: "Open faction vault tools when PlayerVaults is installed.", permission: "factions.vault" },
    ],
  },
  {
    title: "Economy and progression",
    items: [
      { command: "/f money", description: "Manage faction bank actions.", permission: "factions.money" },
      { command: "/f tnt", description: "Deposit, withdraw, inspect, or fill TNT.", permission: "factions.tnt" },
      { command: "/f top", description: "Open faction value leaderboard.", permission: "factions.top" },
      { command: "/f ptop", description: "Open player value leaderboard where enabled.", permission: "factions.ptop" },
      { command: "/f upgrades", description: "View faction upgrades.", permission: "factions.upgrades" },
      { command: "/f missions", description: "View available missions and progress.", permission: "factions.missions" },
      { command: "/f points", description: "View or manage season points.", permission: "factions.points" },
    ],
  },
  {
    title: "Competition",
    items: [
      { command: "/f shield", description: "View or manage faction raid shield windows.", permission: "factions.shield" },
      { command: "/f season", description: "View season status, standings, and phase information.", permission: "factions.season" },
      { command: "/f koth", description: "View active or scheduled KOTH events.", permission: "factions.koth" },
      { command: "/f outpost", description: "View and capture outposts.", permission: "factions.outpost" },
      { command: "/f raid", description: "View raid tools and raid session information.", permission: "factions.raid" },
      { command: "/f raid alerts", description: "Inspect raid alerts where permitted.", permission: "factions.raid.alerts" },
      { command: "/f war", description: "Open the live War Center.", permission: "factions.war" },
    ],
  },
  {
    title: "Staff operations",
    items: [
      { command: "/f reload", description: "Reload configuration safely.", permission: "factions.reload" },
      { command: "/f saveall", description: "Force-save factions data.", permission: "factions.saveall" },
      { command: "/f compatibility report", description: "Review server compatibility information.", permission: "factions.compatibility" },
      { command: "/f logs", description: "Inspect faction activity logs.", permission: "factions.logs" },
      { command: "/f koth admin", description: "Manage KOTH definitions and regions.", permission: "factions.koth.admin" },
      { command: "/f outpost admin", description: "Manage outpost definitions and regions.", permission: "factions.outpost.admin" },
      { command: "/f season admin", description: "Manage season phases, snapshots, archives, and rewards.", permission: "factions.season.admin" },
      { command: "/f rules", description: "Manage warnings, strikes, sanctions, appeals, and competitive enforcement.", permission: "factions.rules" },
    ],
  },
];

const DOC_GROUPS: DocGroup[] = [
  {
    title: "Start Here",
    icon: BookOpen,
    sections: [
      {
        slug: "overview",
        title: "Product overview",
        description: "What MxF Factions is, who it is for, and what the first release is focused on.",
        blocks: [
          {
            type: "paragraph",
            text:
              "MxF Factions is a commercial factions platform for competitive Minecraft servers. It keeps the familiar faction loop, then adds modern server-owner tooling for seasons, outposts, KOTH, raids, GUI flows, analytics, configuration, Discord, and long-term operations.",
          },
          {
            type: "cards",
            items: [
              { title: "Built for competitive servers", body: "Claims, TNT, shields, rosters, leaderboards, events, raids, and seasonal progression are treated as first-class systems." },
              { title: "Owner-first management", body: "Server owners get clean YAML, reloadable settings, menus, permissions, logs, and safer defaults for production environments." },
              { title: "Player-facing polish", body: "Menus, messages, leaderboards, points, missions, upgrades, and war tools are designed to feel like one cohesive product." },
              { title: "Release status", body: "MxF Factions is currently in development. Public docs focus on setup, usage, and configuration customers actually need." },
            ],
          },
          {
            type: "callout",
            title: "Customer-facing docs only",
            text: "This page intentionally skips internal package names, implementation audit labels, raw generated notes, and developer-only noise.",
          },
        ],
      },
      {
        slug: "requirements",
        title: "Requirements",
        description: "Supported server targets, Java/runtime expectations, storage options, and recommended dependencies.",
        blocks: [
          {
            type: "table",
            columns: ["Requirement", "Recommendation"],
            rows: [
              ["Minecraft server", "Spigot, Paper, or Purpur. Spigot 1.8.8 is the primary first target."],
              ["Minecraft versions", "Designed around 1.8.8-first compatibility with broader 1.8.8 to 1.20.x support planned/tested per release."],
              ["Java", "Java 8+ runtime target. Java 8 is safest for 1.8.8 servers."],
              ["Storage", "SQLite for small/simple setups, MySQL for production networks."],
              ["Economy", "Vault plus a compatible economy plugin for bank, prices, rewards, and value systems."],
              ["Recommended hooks", "PlaceholderAPI, WorldEdit, WorldGuard, LuckPerms, PlayerVaults, dynmap, and Discord webhooks where needed."],
            ],
          },
          {
            type: "callout",
            title: "Do not run multiple factions plugins",
            text: "Only one factions plugin should control factions, claims, roles, relations, and power on the same server.",
          },
        ],
      },
      {
        slug: "installation",
        title: "Installation",
        description: "A clean install flow customers can follow without reading internal build notes.",
        blocks: [
          {
            type: "steps",
            items: [
              "Stop the Minecraft server completely.",
              "Back up the full server folder, including worlds, permissions, economy data, and any existing Factions data.",
              "Remove or archive other factions jars so only MxF Factions controls factions behavior.",
              "Upload MxF-Factions.jar into the plugins folder.",
              "Install the optional dependencies you plan to use, such as Vault, PlaceholderAPI, WorldEdit, WorldGuard, LuckPerms, and PlayerVaults.",
              "Start the server once so default files generate.",
              "Stop the server, review plugins/Factions and plugins/Factions/mxf, then configure the features you want enabled.",
              "Start again or run /f reload after safe YAML edits.",
              "Grant player and staff permissions through your permission plugin.",
              "Run the first-run checklist before opening the server to players.",
            ],
          },
          {
            type: "code",
            language: "text",
            code: "/f version\n/f help\n/f reload\n/f create Test\n/f claim\n/f map\n/f tnt info\n/f top\n/f saveall",
          },
        ],
      },
      {
        slug: "first-run-checklist",
        title: "First-run checklist",
        description: "Smoke tests to run after installation or before pushing a new version live.",
        blocks: [
          {
            type: "list",
            items: [
              "Server starts without InvalidPluginException or UnsupportedClassVersionError.",
              "Console shows detected Minecraft version and loaded MxF YAML files.",
              "Root files exist: config.yml, commands.yml, features.yml, messages.yml, menus.yml, integrations.yml, diagnostics.yml, and lang.yml.",
              "MxF files exist under plugins/Factions/mxf.",
              "/f version, /f help, /f reload, /f create, /f claim, /f map, /f tnt info, /f top, and /f saveall respond cleanly.",
              "At least one GUI opens for a player account.",
              "Server stops cleanly and saves data.",
            ],
          },
        ],
      },
      {
        slug: "file-structure",
        title: "Generated files",
        description: "Where server owners will find the files they actually edit or back up.",
        blocks: [
          {
            type: "table",
            columns: ["Path", "Purpose"],
            rows: [
              ["plugins/Factions/config.yml", "Core behavior, placeholder fallback, UI defaults, and base settings."],
              ["plugins/Factions/commands.yml", "Command toggles, aliases, usage, help, and command metadata."],
              ["plugins/Factions/features.yml", "Global feature switches."],
              ["plugins/Factions/messages.yml", "Text style, prefix, symbols, and command messages."],
              ["plugins/Factions/menus.yml", "GUI layouts, menu behavior, themes, sounds, fallback behavior, and item surfaces."],
              ["plugins/Factions/integrations.yml", "Optional hook toggles such as Vault, PlaceholderAPI, WorldEdit, WorldGuard, LuckPerms, dynmap, and PlayerVaults."],
              ["plugins/Factions/diagnostics.yml", "Compatibility summaries and startup diagnostics."],
              ["plugins/Factions/mxf/*.yml", "Feature-specific configuration for TNT, FTop, shields, raids, seasons, missions, outposts, KOTH, rules, visuals, and more."],
              ["plugins/Factions/data", "Runtime data. Back this up regularly."],
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Configuration",
    icon: Settings2,
    sections: [
      {
        slug: "core-config",
        title: "Core configuration",
        description: "The main config files and what customers should use them for.",
        blocks: [
          {
            type: "cards",
            items: [
              { title: "config.yml", body: "Controls base command behavior, UI preferences, placeholder fallback text, and player/staff display rules." },
              { title: "commands.yml", body: "Enables/disables commands and controls command help metadata, usage text, and aliases." },
              { title: "features.yml", body: "Global feature toggles for major MxF systems." },
              { title: "messages.yml", body: "Customer-editable messages, styling, symbols, and command responses." },
              { title: "menus.yml", body: "Menu layouts, themes, sounds, item styling, and text fallback behavior." },
              { title: "integrations.yml", body: "Optional dependency hooks for Vault, PlaceholderAPI, WorldEdit, WorldGuard, LuckPerms, dynmap, PlayerVaults, and related systems." },
            ],
          },
        ],
      },
      {
        slug: "feature-yaml",
        title: "Feature YAML files",
        description: "The major mxf/*.yml files and the systems they control.",
        blocks: [
          {
            type: "table",
            columns: ["File", "Controls"],
            rows: [
              ["mxf/tnt.yml", "TNT bank limits, fill/siphon behavior, radius limits, territory requirements, and container support."],
              ["mxf/ftop.yml", "FTop refresh timing, page size, cooldowns, values, chunk scanning, and leaderboard formatting."],
              ["mxf/timers.yml", "Grace Period and SOTW duration, restrictions, reminders, and broadcasts."],
              ["mxf/shields.yml", "Shield duration, cooldowns, role controls, pending changes, and raid-protection restrictions."],
              ["mxf/raids.yml", "Raid timers, raid claims, explosion detection, reserve mode, duration, radius, cooldowns, and costs."],
              ["mxf/raid-alerts.yml", "Explosion, block damage, breach, entry, valuables, notification, severity, retention, and acknowledgement behavior."],
              ["mxf/outposts.yml", "Capture defaults, rewards, anti-abuse rules, buffs, announcements, and outpost definitions."],
              ["mxf/koth.yml and mxf/koths.yml", "KOTH engine behavior, arena definitions, capture settings, rewards, scheduling, display, and announcements."],
              ["mxf/upgrades.yml and mxf/upgrade-definitions.yml", "Upgrade categories, levels, prices, requirements, and effects."],
              ["mxf/missions.yml and mxf/mission-definitions.yml", "Mission assignment, menus, objective filters, progress saving, and rewards."],
              ["mxf/roster.yml and mxf/alts.yml", "Roster size, join rules, rotation limits, alt limits, invite expiry, and access behavior."],
              ["mxf/vaults.yml", "PlayerVaults usage, max vault count, faction chest behavior, fallback messaging, and admin view settings."],
              ["mxf/analytics.yml and mxf/intelligence.yml", "Snapshots, retention, score weights, recommendations, and monitoring data."],
              ["mxf/seasons.yml, mxf/season-points.yml, mxf/season-rewards.yml", "Season phases, point formatting, leaderboards, reward previews, archive retention, and Hall of Fame data."],
              ["mxf/competitive-rules.yml and mxf/rule-definitions.yml", "Competitive rules, warnings, strikes, sanctions, appeals, automation safety, and case expiration."],
              ["mxf/warps.yml", "Warp delay, max warps, icons, password timeout, and warp menu behavior."],
              ["mxf/compatibility.yml and mxf/visuals.yml", "Version compatibility adapters, material/sound display settings, palettes, symbols, and progress-bar formatting."],
              ["mxf/war-center.yml", "Live War Center refresh, public views, alerts, and war-facing sections."],
            ],
          },
        ],
      },
      {
        slug: "menus-visuals",
        title: "Menus and visuals",
        description: "GUI surfaces and player-facing presentation controls.",
        blocks: [
          {
            type: "paragraph",
            text:
              "menus.yml is the main place to shape the user experience. MxF Factions uses GUI-first flows where possible, with clean text fallback for console, unsupported flows, or disabled menus.",
          },
          {
            type: "list",
            items: [
              "Roster, alts, audit logs, upgrades, TNT, shields, permissions, settings, warps, warp icons, raid, raid claims, raid recaps, corners, outposts, KOTH, vaults, faction chest, analytics, intelligence, seasons, Hall of Fame, rewards, help, top, points top, missions, War Center, and menu hub surfaces.",
              "Menu themes, sounds, item names, lore, fallback text, and click feedback are configurable.",
              "Messages and visuals can be adjusted independently so server owners can match their brand.",
            ],
          },
        ],
      },
      {
        slug: "integrations",
        title: "Integrations",
        description: "Optional hooks that unlock economy, placeholders, regions, vaults, permissions, maps, and Discord workflows.",
        blocks: [
          {
            type: "table",
            columns: ["Integration", "Use"],
            rows: [
              ["Vault", "Economy bridge for faction bank, money pricing, reward commands, and value systems."],
              ["Economy plugin", "Provides the actual currency provider behind Vault."],
              ["PlaceholderAPI", "Enables public placeholder groups for scoreboards, holograms, menus, and other plugins."],
              ["WorldEdit", "Region selection support for KOTH, outposts, and raid outpost style features."],
              ["WorldGuard", "Region compatibility where your server uses WorldGuard protection."],
              ["LuckPerms", "Permission and group context compatibility."],
              ["PlayerVaults", "Faction vault and chest backend where enabled."],
              ["dynmap", "Map display support where configured."],
              ["Discord", "Webhook and server-owner notification workflows where configured."],
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Gameplay",
    icon: ClipboardList,
    sections: [
      {
        slug: "core-factions",
        title: "Core factions",
        description: "The baseline faction systems players expect from a serious factions server.",
        blocks: [
          {
            type: "cards",
            items: [
              { title: "Faction lifecycle", body: "Create, join, invite, leave, kick, rename, transfer leadership, open/close, set descriptions, and disband." },
              { title: "Roles and permissions", body: "Leader, coleader/admin-style flows, promotions, demotions, member titles, and role-aware access." },
              { title: "Relations", body: "Enemy, neutral, truce, and ally style relation workflows depending on server configuration." },
              { title: "Player flow", body: "Homes, warps, map, faction profile, faction list, chat, money, and help systems." },
            ],
          },
        ],
      },
      {
        slug: "claims-territory",
        title: "Claims and territory",
        description: "Land control, protection, maps, and territory tools.",
        blocks: [
          {
            type: "list",
            items: [
              "Claim and unclaim chunks with standard command flows.",
              "Use autoclaim and map tools for faster base setup.",
              "Support advanced claim tooling such as radius, fill, corner, and buffer visibility where enabled.",
              "SafeZone, WarZone, explosion rules, piston behavior, and world restrictions are controlled by configuration.",
              "Claim analytics and territory visibility help staff and faction leaders understand map pressure.",
            ],
          },
        ],
      },
      {
        slug: "tnt-economy",
        title: "TNT, economy, and value",
        description: "TNT bank, faction money, value snapshots, FTop, and PTop.",
        blocks: [
          {
            type: "cards",
            items: [
              { title: "TNT bank", body: "Deposit, withdraw, inspect, fill, and siphon TNT depending on configured permissions and limits." },
              { title: "Faction bank", body: "Faction money actions run through Vault/economy support where installed." },
              { title: "FTop", body: "Cached faction value leaderboard with configurable refresh intervals, worth maps, and chunk scanning limits." },
              { title: "PTop", body: "Player value leaderboard support where personal tracking data is enabled." },
            ],
          },
        ],
      },
      {
        slug: "roster-alts-vaults",
        title: "Roster, alts, warps, homes, and vaults",
        description: "Member organization, movement tools, and faction storage surfaces.",
        blocks: [
          {
            type: "list",
            items: [
              "Roster systems help owners control member lists, join requirements, rotations, and roster limits.",
              "Alt controls help reduce abuse by tracking alt rules, invite behavior, and configured limits.",
              "Homes and warps provide clean faction navigation with permissions and menu support.",
              "Vault and faction chest surfaces integrate with PlayerVaults where installed.",
              "Warp icons, password timeout, and menu behavior are configurable in YAML.",
            ],
          },
        ],
      },
      {
        slug: "shields-timers",
        title: "Shields, Grace, SOTW, and timers",
        description: "Protection windows and season-start controls for competitive servers.",
        blocks: [
          {
            type: "list",
            items: [
              "Grace Period and SOTW can control early-season restrictions, reminders, and broadcasts.",
              "Faction shields provide configurable protection windows, cooldowns, pending changes, and role controls.",
              "Raid restrictions can be tied into shield and timer logic depending on server rules.",
              "Timer settings live in dedicated YAML files rather than one crowded config.",
            ],
          },
        ],
      },
      {
        slug: "seasons-points",
        title: "Seasons and points",
        description: "Season phases, points, leaderboards, reward previews, archives, and Hall of Fame surfaces.",
        blocks: [
          {
            type: "cards",
            items: [
              { title: "Season phases", body: "Track configured phases, broadcasts, restrictions, and phase-specific behavior." },
              { title: "Season points", body: "Award, format, view, and rank factions using point-based progression." },
              { title: "Reward previews", body: "Preview season payouts and rewards before enabling live delivery." },
              { title: "Archives", body: "Keep historical season records and Hall of Fame style results." },
            ],
          },
        ],
      },
      {
        slug: "events-raids",
        title: "KOTH, outposts, raids, and War Center",
        description: "Competitive events and war-focused tools for active factions servers.",
        blocks: [
          {
            type: "cards",
            items: [
              { title: "KOTH", body: "Configured arenas, capture behavior, scheduling, rewards, announcements, and display controls." },
              { title: "Outposts", body: "Capture regions, hold rewards, buffs, anti-abuse rules, and server announcements." },
              { title: "Raids", body: "Raid timers, raid claims, raid alerts, recaps, histories, and staff visibility tools." },
              { title: "War Center", body: "A live command surface for war activity, alerts, public views, and faction pressure." },
            ],
          },
        ],
      },
      {
        slug: "rules-analytics",
        title: "Rules, analytics, and intelligence",
        description: "Moderation, monitoring, and competitive visibility without exposing staff-only data to players.",
        blocks: [
          {
            type: "list",
            items: [
              "Competitive rules can support warnings, strikes, sanctions, appeals, penalties, and undo workflows for staff.",
              "Analytics can track faction snapshots, activity, economy pressure, raids, outposts, and season progression.",
              "Intelligence scoring can help staff understand risk and performance without turning public views into staff panels.",
              "Staff-only evidence, notes, and sensitive details stay permission-gated.",
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Reference",
    icon: TerminalSquare,
    sections: [
      {
        slug: "commands",
        title: "Command reference",
        description: "A practical command index grouped by customer-facing use case.",
        blocks: [{ type: "commands", groups: commandGroups }],
      },
      {
        slug: "permissions",
        title: "Permission reference",
        description: "Common permission groups to plan before launch.",
        blocks: [
          {
            type: "table",
            columns: ["Area", "Example nodes"],
            rows: [
              ["General player", "factions.help, factions.create, factions.join, factions.leave, factions.show, factions.list"],
              ["Faction management", "factions.invite, factions.kick, factions.promote, factions.demote, factions.title, factions.disband"],
              ["Claims", "factions.claim, factions.unclaim, factions.autoclaim, factions.map, factions.claims"],
              ["Economy and TNT", "factions.money, factions.tnt, factions.top, factions.ptop"],
              ["Progression", "factions.upgrades, factions.missions, factions.points, factions.season"],
              ["Events", "factions.koth, factions.outpost, factions.raid, factions.raid.alerts, factions.war"],
              ["Staff", "factions.reload, factions.saveall, factions.logs, factions.compatibility, factions.admin"],
              ["Admin systems", "factions.koth.admin, factions.outpost.admin, factions.raid.admin, factions.season.admin, factions.rules"],
              ["Sensitive UI", "factions.ui.staffdetails, factions.ui.debug"],
            ],
          },
          {
            type: "callout",
            title: "Use least privilege",
            text: "Give normal players only the commands they need, give trusted staff operational commands, and reserve admin/debug nodes for owners.",
          },
        ],
      },
      {
        slug: "placeholders",
        title: "PlaceholderAPI reference",
        description: "Placeholder support for scoreboards, menus, holograms, and compatible plugins.",
        blocks: [
          {
            type: "paragraph",
            text:
              "When PlaceholderAPI is installed, MxF Factions exposes factions and MxF placeholder groups for server displays. Exact placeholder names can vary by release, but customers should plan around these groups.",
          },
          {
            type: "table",
            columns: ["Group", "Typical use"],
            rows: [
              ["Faction identity", "Faction name, tag, role, description, member count, online count."],
              ["Power and claims", "Faction power, max power, claim count, territory status."],
              ["Economy", "Faction bank, FTop value, rank, worth, and leaderboard values."],
              ["Season", "Season points, season rank, current phase, and Hall of Fame style data."],
              ["Events", "KOTH status, outpost owner, capture progress, raid status, and shield information."],
              ["Player context", "Current faction, relation status, role, permission context, and activity surfaces."],
            ],
          },
        ],
      },
      {
        slug: "storage-backups",
        title: "Storage and backups",
        description: "What to back up and when to use MySQL.",
        blocks: [
          {
            type: "list",
            items: [
              "Use SQLite for local testing or simple servers.",
              "Use MySQL for production networks, larger maps, frequent events, or multi-server workflows.",
              "Back up plugins/Factions before updates, large config changes, season changes, and migrations.",
              "Back up runtime data, worlds, permissions, economy data, and any old FactionsUUID data before swapping jars.",
              "Keep a known-good previous jar and matching data backup for rollback.",
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Guides",
    icon: FileText,
    sections: [
      {
        slug: "player-guide",
        title: "Player guide",
        description: "A short player onboarding flow server owners can adapt.",
        blocks: [
          {
            type: "steps",
            items: [
              "Create a faction with /f create <name> or join one with /f join <faction>.",
              "Invite members with /f invite <player>.",
              "Claim land with /f claim and use /f map to understand nearby territory.",
              "Set faction home with /f sethome.",
              "Store TNT with /f tnt deposit <amount> if your role allows it.",
              "Use /f upgrades and /f missions to view progression.",
              "Use /f shield to manage raid protection if your role allows it.",
              "Use /f top, /f ptop, /f points, and /f season to follow competition.",
              "Use /f outpost, /f koth, /f raid, and /f war during active events.",
            ],
          },
        ],
      },
      {
        slug: "staff-guide",
        title: "Staff guide",
        description: "Daily staff operations and safe operating practices.",
        blocks: [
          {
            type: "list",
            items: [
              "Use /f reload after safe YAML edits and /f saveall before maintenance.",
              "Use compatibility reports when testing new server jars or dependency versions.",
              "Review logs and raid alerts before taking action.",
              "Use KOTH and outpost admin commands to verify regions before events go live.",
              "Use season admin commands for phases, snapshots, archives, and reward preview checks.",
              "Keep automatic punishments and destructive actions conservative until your rules are proven on the live server.",
              "Limit staff details and debug UI permissions to trusted staff only.",
            ],
          },
        ],
      },
      {
        slug: "troubleshooting",
        title: "Troubleshooting",
        description: "Common problems customers can solve without digging through raw logs for hours.",
        blocks: [
          {
            type: "table",
            columns: ["Problem", "Likely cause", "Fix"],
            rows: [
              ["Plugin not loading", "Wrong jar, missing server support, or startup exception.", "Check console from the first Factions line and restore the previous jar if needed."],
              ["UnsupportedClassVersionError", "Java/runtime mismatch.", "Use a compatible Java runtime. Java 8 is safest for 1.8.8 servers."],
              ["InvalidPluginException", "Stale jar, bad copy, or plugin metadata problem.", "Reupload the correct jar and verify the file in plugins."],
              ["Missing dependency warning", "Optional hook not installed.", "Install the compatible dependency or disable that hook/feature."],
              ["Invalid YAML", "Indentation, quotes, or wrong data type.", "Validate YAML, restore backup, then rerun /f reload."],
              ["Command missing", "Command or feature is disabled.", "Check commands.yml, features.yml, and startup logs."],
              ["Permission denied", "Missing Bukkit node or faction role permission.", "Grant the node and check faction permission settings."],
              ["GUI does not open", "Menus disabled, console sender, invalid material, or unsupported version.", "Check menus.yml, compatibility settings, and fallback text."],
              ["Placeholder not parsing", "PlaceholderAPI missing or wrong identifier.", "Install PlaceholderAPI and test placeholders as a player."],
              ["FTop has no data", "Snapshot not refreshed or no configured value source.", "Run /f refreshtop where available and check mxf/ftop.yml."],
              ["KOTH or outpost not capturing", "Region, eligibility, schedule, or contest settings.", "Check event status and region setup before going live."],
              ["Season command blocked", "Current season phase restrictions.", "Review mxf/seasons.yml and phase rules."],
            ],
          },
        ],
      },
      {
        slug: "support-template",
        title: "Support request template",
        description: "The info customers should send when they need help.",
        blocks: [
          {
            type: "code",
            language: "text",
            code:
              "MxF Factions version:\nServer software:\nMinecraft version:\nJava version:\nDependencies installed:\nWhat you tried:\nExpected result:\nActual result:\nConsole error:\nSteps to reproduce:\nRelevant config file:\nScreenshots or video:\nHow often it happens:",
          },
        ],
      },
    ],
  },
  {
    title: "Safety",
    icon: ShieldAlert,
    sections: [
      {
        slug: "launch-safety",
        title: "Launch safety",
        description: "How to test MxF Factions without risking a production server.",
        blocks: [
          {
            type: "list",
            items: [
              "Test on a copied staging server before installing on a live network.",
              "Run a fresh install test and a migration test from existing data copies.",
              "Open major GUIs with a real Minecraft client.",
              "Test restart persistence after creating factions, claims, TNT data, warps, homes, missions, and event data.",
              "Run /f reload repeatedly after config changes on staging.",
              "Test optional dependencies you actually plan to use.",
              "Observe FTop refreshes, KOTH/outpost ticks, raid alerts, and season snapshots under realistic load.",
            ],
          },
        ],
      },
      {
        slug: "known-notes",
        title: "Release notes customers should know",
        description: "Clear expectations without exposing internal development notes.",
        blocks: [
          {
            type: "list",
            items: [
              "MxF Factions is in active development and should be tested on staging before production.",
              "Spigot 1.8.8 is the first verified target. Other versions should be tested with the exact server jar and dependencies you plan to run.",
              "Optional integrations depend on matching plugin versions.",
              "Automatic punishments and destructive season actions should stay conservative until your staff team validates the rule set.",
              "Some visual behavior, such as titles, actionbars, bossbars, sounds, particles, and materials, can vary by Minecraft version.",
            ],
          },
        ],
      },
    ],
  },
];

function blockText(block: DocBlock): string {
  if (block.type === "paragraph") return block.text;
  if (block.type === "callout") return `${block.title} ${block.text}`;
  if (block.type === "list" || block.type === "steps") return block.items.join(" ");
  if (block.type === "code") return block.code;
  if (block.type === "table") return `${block.columns.join(" ")} ${block.rows.flat().join(" ")}`;
  if (block.type === "cards") return block.items.map((item) => `${item.title} ${item.body} ${item.meta ?? ""}`).join(" ");
  return block.groups
    .map((group) => `${group.title} ${group.items.map((item) => `${item.command} ${item.description} ${item.permission ?? ""}`).join(" ")}`)
    .join(" ");
}

function sectionText(section: DocSection, groupTitle: string) {
  return `${groupTitle} ${section.title} ${section.description} ${section.blocks.map(blockText).join(" ")}`.toLowerCase();
}

function renderBlock(block: DocBlock, index: number) {
  if (block.type === "paragraph") {
    return <p key={index} className="text-sm leading-7 text-white/58">{block.text}</p>;
  }

  if (block.type === "callout") {
    return (
      <div key={index} className="rounded-lg border border-[#ffd166]/20 bg-[#ffd166]/8 p-4">
        <p className="text-sm font-semibold text-[#ffe1a3]">{block.title}</p>
        <p className="mt-2 text-sm leading-6 text-white/58">{block.text}</p>
      </div>
    );
  }

  if (block.type === "list") {
    return (
      <ul key={index} className="grid gap-2">
        {block.items.map((item) => (
          <li key={item} className="flex gap-3 rounded-md border border-white/8 bg-white/[0.026] p-3 text-sm leading-6 text-white/58">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#ffd166]" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (block.type === "steps") {
    return (
      <ol key={index} className="grid gap-3">
        {block.items.map((item, itemIndex) => (
          <li key={item} className="flex gap-3 rounded-md border border-white/8 bg-white/[0.026] p-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[#ff6262]/12 font-mono text-xs text-[#ff9d9d]">
              {String(itemIndex + 1).padStart(2, "0")}
            </span>
            <span className="text-sm leading-6 text-white/58">{item}</span>
          </li>
        ))}
      </ol>
    );
  }

  if (block.type === "cards") {
    return (
      <div key={index} className="grid gap-3 md:grid-cols-2">
        {block.items.map((item) => (
          <div key={item.title} className="rounded-lg border border-white/9 bg-white/[0.028] p-4">
            {item.meta ? <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[#ff8a8a]">{item.meta}</p> : null}
            <h4 className="text-base font-semibold text-white">{item.title}</h4>
            <p className="mt-2 text-sm leading-6 text-white/52">{item.body}</p>
          </div>
        ))}
      </div>
    );
  }

  if (block.type === "table") {
    return (
      <div key={index} className="overflow-x-auto rounded-lg border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/[0.045] text-xs uppercase tracking-[0.14em] text-white/44">
            <tr>
              {block.columns.map((column) => (
                <th key={column} className="px-4 py-3 font-semibold">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8 bg-black/18">
            {block.rows.map((row) => (
              <tr key={row.join("|")}>
                {row.map((cell, cellIndex) => (
                  <td key={`${cell}-${cellIndex}`} className={`px-4 py-3 align-top leading-6 ${cellIndex === 0 ? "font-semibold text-white/78" : "text-white/54"}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (block.type === "commands") {
    return (
      <div key={index} className="grid gap-4">
        {block.groups.map((group) => (
          <div key={group.title} className="rounded-lg border border-white/10 bg-black/18 p-4">
            <h4 className="text-base font-semibold text-white">{group.title}</h4>
            <div className="mt-4 grid gap-2">
              {group.items.map((item) => (
                <div key={item.command} className="grid gap-2 rounded-md border border-white/8 bg-white/[0.026] p-3 md:grid-cols-[13rem_1fr_12rem] md:items-center">
                  <code className="font-mono text-xs text-[#ff9d9d]">{item.command}</code>
                  <p className="text-sm leading-6 text-white/58">{item.description}</p>
                  <p className="font-mono text-[0.68rem] text-white/36">{item.permission}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <pre key={index} className="overflow-x-auto rounded-lg border border-white/10 bg-black/36 p-4 text-xs leading-6 text-white/70">
      <code>{block.code}</code>
    </pre>
  );
}

export function FactionsDocsBrowser() {
  const [activeSlug, setActiveSlug] = useState(DOC_GROUPS[0]?.sections[0]?.slug ?? "");
  const [query, setQuery] = useState("");

  const filteredGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return DOC_GROUPS;
    }

    return DOC_GROUPS
      .map((group) => ({
        ...group,
        sections: group.sections.filter((section) => sectionText(section, group.title).includes(normalizedQuery)),
      }))
      .filter((group) => group.sections.length > 0);
  }, [query]);

  const allVisibleSections = filteredGroups.flatMap((group) => group.sections.map((section) => ({ ...section, groupTitle: group.title })));
  const activeSection = allVisibleSections.find((section) => section.slug === activeSlug) ?? allVisibleSections[0] ?? null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#07090d]/88 premium-depth">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,98,98,0.14),transparent_30%),radial-gradient(circle_at_92%_18%,rgba(255,209,102,0.07),transparent_34%)]" />
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#ff6262]/60 to-transparent" />
      <div className="relative border-b border-white/10 p-5 md:p-7">
        <div className="grid gap-5 lg:grid-cols-[1fr_24rem] lg:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff6262]">Product manual</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-white md:text-5xl">MxF Factions documentation.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/54">
              Install guidance, configuration maps, gameplay systems, commands, permissions, placeholders, staff
              operations, and support notes for server owners.
            </p>
          </div>
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/34" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search docs..."
              className="h-12 w-full rounded-md border border-white/10 bg-black/28 pl-10 pr-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/32 focus:border-[#ff6262]/45"
            />
          </label>
        </div>
      </div>

      <div className="relative grid min-h-[42rem] lg:grid-cols-[18rem_1fr]">
        <aside className="border-b border-white/10 bg-black/16 p-4 lg:border-b-0 lg:border-r">
          <div className="max-h-[34rem] overflow-y-auto pr-1 lg:sticky lg:top-32">
            {filteredGroups.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-white/[0.026] p-4 text-sm text-white/50">
                No matching docs found.
              </div>
            ) : (
              filteredGroups.map((group) => {
                const Icon = group.icon;
                return (
                  <div key={group.title} className="mb-5">
                    <div className="mb-2 flex items-center gap-2 px-2">
                      <Icon className="h-3.5 w-3.5 text-[#ff8a8a]" aria-hidden="true" />
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/34">{group.title}</p>
                    </div>
                    <div className="grid gap-1">
                      {group.sections.map((section) => {
                        const active = section.slug === activeSection?.slug;
                        return (
                          <button
                            key={section.slug}
                            type="button"
                            onClick={() => setActiveSlug(section.slug)}
                            className={`group flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold transition ${
                              active ? "bg-white text-black" : "text-white/56 hover:bg-white/[0.055] hover:text-white"
                            }`}
                          >
                            <span>{section.title}</span>
                            <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition ${active ? "text-black/54" : "text-white/24 group-hover:text-white/52"}`} aria-hidden="true" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        <main className="min-w-0 bg-black/[0.08] p-5 md:p-8">
          {activeSection ? (
            <article className="mx-auto max-w-4xl">
              <div className="mb-7 flex flex-col gap-4 border-b border-white/10 pb-7">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#ff6262]">{activeSection.groupTitle}</p>
                <h3 className="text-3xl font-semibold leading-tight text-white md:text-5xl">{activeSection.title}</h3>
                <p className="max-w-3xl text-sm leading-7 text-white/54">{activeSection.description}</p>
              </div>
              <div className="grid gap-5">{activeSection.blocks.map(renderBlock)}</div>
            </article>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/[0.026] p-5 text-sm text-white/50">
              No docs available for this search.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
