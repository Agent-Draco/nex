#!/bin/bash
set -e

# --- SCRIPT WARNING ---
# This script automates the setup of a custom Linux environment called "VeridianOS Sprout".
# It will install software packages, create configuration files, and modify user settings.
#
# !!! WARNING !!!
# This script is intended for advanced users ONLY.
# It should be run in a SAFE, ISOLATED ENVIRONMENT such as a dedicated Virtual Machine (VM)
# or a container (e.g., LXC, Docker).
# DO NOT run this script on your primary operating system or any system where data loss
# or configuration changes are unacceptable.
# Running this script may lead to system instability or unintended side effects if not
# used in an appropriate environment.
# Review the script's contents thoroughly before execution to understand its actions.
# --- END WARNING ---

# OS Concept Details
OS_NAME="VeridianOS"
CODENAME="Sprout"
BOOT_SCREEN_ASCII="       .-'''-.\\n      /       \\\\n     |  .---.  |\\n     |  '---'  |\\n     |         |\\n      \\\\_______/\\n\\n    🌿 V E R I D I A N O S 🌿\\n      --= S P R O U T =--\\n\\n    Booting Life into Pi..."
PHILOSOPHY="VeridianOS is engineered as a lean, green operating system designed specifically for the Raspberry Pi and other low-resource ARM devices. Its core philosophy revolves around providing an accessible, energy-efficient platform that prioritizes visual programming and educational computing. By integrating a custom 'Green OS' Scratch project as its primary frontend, VeridianOS aims to be a direct, intuitive environment for creators, educators, and hobbyists, while retaining the full power and flexibility of a Linux backend for advanced users."
DEFAULT_PACKAGES=(
    "scratch-desktop-pi"
    "python3"
    "python3-pip" # Replaced 'pip' with 'python3-pip' for Debian/Ubuntu compatibility
    "git"
    "build-essential"
    "openbox"
    "picom"
    "epiphany-browser"
    "htop"
    "neofetch"
    "raspi-config"
    "xterm" # Added for basic terminal access within the Openbox session
)
DESKTOP_ENVIRONMENT="PicoShell (a custom minimal shell for direct Scratch project execution, built on Openbox)"

echo -e "${BOOT_SCREEN_ASCII}"
echo ""
echo "Welcome to the ${OS_NAME} ${CODENAME} setup script!"
echo "----------------------------------------------------"
echo "${PHILOSOPHY}"
echo ""

# Check for root privileges
if [ "$(id -u)" -ne 0 ]; then
    echo "This script must be run as root. Please use sudo."
    exit 1
fi

echo "Step 1/3: Updating package lists..."
apt-get update

echo "Step 2/3: Installing core packages for ${OS_NAME} ${CODENAME}..."
# Convert array to space-separated string for apt-get
PACKAGES_TO_INSTALL="${DEFAULT_PACKAGES[*]}"
apt-get install -y ${PACKAGES_TO_INSTALL}

echo "Step 3/3: Configuring ${DESKTOP_ENVIRONMENT}..."

# Determine the user's home directory and username for configuration
# This assumes the script is run with `sudo` and the user's home is accessible via $SUDO_USER
if [ -n "$SUDO_USER" ]; then
    USER_HOME=$(eval echo "~$SUDO_USER")
    USER_NAME=$SUDO_USER
else
    # Fallback if not run via sudo, or if SUDO_USER is not set (less ideal for user config)
    echo "Warning: SUDO_USER not set. Configuring for current user ($USER) in $HOME."
    USER_HOME=$HOME
    USER_NAME=$(whoami)
fi

# Create Openbox configuration directory for the user
echo "  - Creating Openbox configuration for user '${USER_NAME}' in '${USER_HOME}/.config/openbox'..."
mkdir -p "${USER_HOME}/.config/openbox"
# Ensure the .config directory and its contents are owned by the target user
chown -R "${USER_NAME}:${USER_NAME}" "${USER_HOME}/.config"

# Copy default Openbox config files or create minimal ones if system defaults are not found
# This provides a base for customization
if [ -d "/etc/xdg/openbox" ]; then
    echo "  - Copying system default Openbox configuration files as a base..."
    cp /etc/xdg/openbox/rc.xml "${USER_HOME}/.config/openbox/rc.xml"
    cp /etc/xdg/openbox/menu.xml "${USER_HOME}/.config/openbox/menu.xml"
    cp /etc/xdg/openbox/environment "${USER_HOME}/.config/openbox/environment" 2>/dev/null || true
else
    echo "  - System default Openbox configuration not found. Creating minimal configuration files."
    # Minimal rc.xml for basic keybinds and menu
    cat << EOF > "${USER_HOME}/.config/openbox/rc.xml"
<?xml version="1.0" encoding="UTF-8"?>
<openbox_config xmlns="http://openbox.org/3.4/rc">
  <theme>
    <name>Clearlooks</name>
  </theme>
  <menu>
    <file>menu.xml</file>
  </menu>
  <keyboard>
    <key bind="A-space">
      <action name="ShowMenu">
        <menu>root-menu</menu>
      </action>
    </key>
    <key bind="C-A-Delete">
      <action name="Exit"/>
    </key>
    <key bind="W-Return">
      <action name="Execute">
        <command>xterm</command>
      </action>
    </key>
  </keyboard>
  <mouse>
    <context name="Root">
      <mousebind button="A-1" action="Press">
        <action name="ShowMenu">
          <menu>root-menu</menu>
        </action>
      </mousebind>
    </context>
  </mouse>
</openbox_config>
EOF

    # Minimal menu.xml for application launching
    cat << EOF > "${USER_HOME}/.config/openbox/menu.xml"
<?xml version="1.0" encoding="UTF-8"?>
<openbox_menu xmlns="http://openbox.org/3.4/menu">
  <menu id="root-menu" label="${OS_NAME} ${CODENAME}">
    <item label="Scratch Desktop">
      <action name="Execute">
        <command>scratch-desktop-pi</command>
      </action>
    </item>
    <item label="Terminal (xterm)">
      <action name="Execute">
        <command>xterm</command>
      </action>
    </item>
    <item label="Web Browser (Epiphany)">
      <action name="Execute">
        <command>epiphany-browser</command>
      </action>
    </item>
    <separator/>
    <item label="Neofetch">
      <action name="Execute">
        <command>xterm -e neofetch</command>
      </action>
    </item>
    <item label="Htop">
      <action name="Execute">
        <command>xterm -e htop</command>
      </action>
    </item>
    <separator/>
    <item label="Reconfigure Openbox">
      <action name="Reconfigure"/>
    </item>
    <item label="Exit">
      <action name="Exit"/>
    </item>
  </menu>
</openbox_menu>
EOF
fi

# Create/overwrite autostart file for PicoShell behavior
echo "  - Configuring Openbox autostart to launch Scratch Desktop as primary interface..."
cat << EOF > "${USER_HOME}/.config/openbox/autostart"
#!/bin/bash

# Start compositor for smooth visuals
picom &

# Launch Scratch Desktop as the main shell for the session.
# If scratch-desktop-pi exits, the Openbox session will terminate.
# Users can switch to a full CLI by pressing Ctrl+Alt+F1-F6.
# A terminal can also be launched from the Openbox menu (Alt+Space or Right-Click on desktop).
exec scratch-desktop-pi
EOF

# Set executable permissions and correct ownership for the autostart script
chmod +x "${USER_HOME}/.config/openbox/autostart"
chown "${USER_NAME}:${USER_NAME}" "${USER_HOME}/.config/openbox/autostart"
chown "${USER_NAME}:${USER_NAME}" "${USER_HOME}/.config/openbox/rc.xml"
chown "${USER_NAME}:${USER_NAME}" "${USER_HOME}/.config/openbox/menu.xml"

echo ""
echo "----------------------------------------------------"
echo "${OS_NAME} ${CODENAME} setup complete!"
echo "----------------------------------------------------"
echo "You have successfully set up the ${OS_NAME} ${CODENAME} environment."
echo ""
echo "Next steps:"
echo "1. To start the graphical environment, you can:"
echo "   a. If you have a display manager (like LightDM or GDM) installed, log out and select 'Openbox' as your session."
echo "   b. If you don't have a display manager, you can start it manually from a TTY (Ctrl+Alt+F1-F6) by running 'startx'."
echo "2. Once in the graphical environment, 'Scratch Desktop' will launch automatically as your primary interface."
echo "3. To access a terminal, use the Openbox menu (Alt+Space or Right-Click on desktop) or press the Super (Windows) key + Enter."
echo ""
echo "Enjoy your lean, green, visual programming environment!"
echo ""