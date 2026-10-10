import React from "react";
import { Platform, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@react-native-vector-icons/ionicons";

import SponsorHomeScreen from "../screens/sponsors/SponsorHomeScreen";
import SponsorDiscoverScreen from "../screens/sponsors/SponsorDiscoverScreen";
import SponsorMatchesScreen from "../screens/sponsors/SponsorMatchesScreen";
import SponsorMessagesScreen from "../screens/sponsors/SponsorMessagesScreen";
import SponsorImpactScreen from "../screens/sponsors/SponsorImpactScreen";
import SponsorProfileScreen from "../screens/sponsors/SponsorProfileScreen";
import useUnreadMessages from "../hooks/useUnreadMessages";

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
    Home: ["home", "home-outline"],
    Discover: ["compass", "compass-outline"],
    Matches: ["heart", "heart-outline"],
    Messages: ["chatbubble", "chatbubble-outline"],
    Impact: ["analytics", "analytics-outline"],
    Profile: ["person-circle", "person-circle-outline"],
};

// Bottom tab bar for the Sponsor experience. Mirrors the structure of
// AppNavigator's NGO `MainTabs`, with an extra "Discover" tab for browsing
// NGOs/opportunities.
export default function SponsorNavigator({ route }) {
    const unreadCount = useUnreadMessages();
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: "#10B981",
                tabBarInactiveTintColor: "#94A3B8",
                tabBarStyle: styles.tabBar,
                tabBarLabelStyle: styles.tabLabel,
                tabBarItemStyle: styles.tabItem,
                tabBarShowLabel: true,
                tabBarHideOnKeyboard: true,
                tabBarIcon: ({ color, focused }) => (
                    <Ionicons name={TAB_ICONS[route.name][focused ? 0 : 1]} size={21} color={color} />
                ),
            })}
        >
            <Tab.Screen name="Home" component={SponsorHomeScreen} initialParams={route?.params?.params || route?.params} />
            <Tab.Screen name="Discover" component={SponsorDiscoverScreen} />
            <Tab.Screen name="Matches" component={SponsorMatchesScreen} />
            <Tab.Screen name="Messages" component={SponsorMessagesScreen} options={{ tabBarBadge: unreadCount > 0 ? unreadCount : undefined, tabBarBadgeStyle: styles.unreadBadge }} />
            <Tab.Screen name="Impact" component={SponsorImpactScreen} />
            <Tab.Screen name="Profile" component={SponsorProfileScreen} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        height: Platform.OS === "ios" ? 76 : 66,
        paddingTop: 5,
        paddingBottom: Platform.OS === "ios" ? 17 : 5,
        paddingHorizontal: 3,
        borderTopWidth: 1,
        borderTopColor: "#E6EEE9",
        backgroundColor: "#FFFFFF",
        elevation: 12,
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
    },
    tabItem: { flex: 1, minWidth: 0, paddingHorizontal: 0 },
    tabLabel: { fontSize: 9, fontWeight: "600", marginTop: 1, letterSpacing: 0.1 },
    unreadBadge: { backgroundColor: "#C2413A", color: "#FFFFFF", fontSize: 9, fontWeight: "700", minWidth: 18, height: 18, lineHeight: 18, borderRadius: 9 },
});
