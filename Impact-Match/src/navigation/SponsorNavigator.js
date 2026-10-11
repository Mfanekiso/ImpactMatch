import React from "react";
import { Platform, StyleSheet, View } from "react-native";
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
    Matches: ["people", "people-outline"],
    Messages: ["chatbubbles", "chatbubbles-outline"],
    Impact: ["analytics", "analytics-outline"],
};

const COLORS = {
    background: "#FFFFFF",
    border: "#DCEFE6",
    active: "#087A55",
    inactive: "#8A9A92",
    activeWash: "#E8F6EF",
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
                tabBarActiveTintColor: COLORS.active,
                tabBarInactiveTintColor: COLORS.inactive,
                tabBarStyle: styles.tabBar,
                tabBarLabelStyle: styles.tabLabel,
                tabBarItemStyle: styles.tabItem,
                tabBarShowLabel: true,
                tabBarHideOnKeyboard: true,
                tabBarBackground: () => <View style={styles.tabBarBackground} />,
                tabBarIcon: ({ color, focused }) => (
                    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                        <Ionicons name={TAB_ICONS[route.name][focused ? 0 : 1]} size={24} color={focused ? COLORS.active : color} />
                    </View>
                ),
            })}
        >
            <Tab.Screen name="Home" component={SponsorHomeScreen} initialParams={route?.params?.params || route?.params} />
            <Tab.Screen name="Discover" component={SponsorDiscoverScreen} />
            <Tab.Screen name="Matches" component={SponsorMatchesScreen} />
            <Tab.Screen name="Messages" component={SponsorMessagesScreen} options={{ tabBarBadge: unreadCount > 0 ? unreadCount : undefined, tabBarBadgeStyle: styles.unreadBadge }} />
            <Tab.Screen name="Impact" component={SponsorImpactScreen} />
            <Tab.Screen
                name="Profile"
                component={SponsorProfileScreen}
                options={{ tabBarButton: () => null }}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        position: "absolute",
        left: 14,
        right: 14,
        bottom: Platform.OS === "ios" ? 18 : 12,
        height: 70,
        borderRadius: 24,
        backgroundColor: COLORS.background,
        borderTopWidth: 1,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingTop: 6,
        paddingBottom: 7,
        paddingHorizontal: 7,
        ...Platform.select({
            web: { boxShadow: "0px 16px 40px rgba(15, 23, 42, 0.13), 0px 4px 12px rgba(16, 185, 129, 0.16)" },
            default: {
                shadowColor: "#0F172A",
                shadowOffset: { width: 0, height: 14 },
                shadowOpacity: 0.13,
                shadowRadius: 26,
                elevation: 15,
            },
        }),
    },
    tabBarBackground: { flex: 1, borderRadius: 24, backgroundColor: COLORS.background },
    tabItem: { borderRadius: 20, marginHorizontal: 4, paddingVertical: 4 },
    tabLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 0.35, marginTop: 3, marginBottom: 1 },
    iconWrap: { width: 44, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
    iconWrapActive: {
        backgroundColor: COLORS.activeWash,
        ...Platform.select({
            web: { boxShadow: "0px 4px 14px rgba(16, 185, 129, 0.22)" },
            default: { shadowColor: "#10B981", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 9, elevation: 4 },
        }),
    },
    unreadBadge: { backgroundColor: "#C2413A", color: "#FFFFFF", fontSize: 10, fontWeight: "700", minWidth: 18, height: 18, lineHeight: 18, borderRadius: 9 },
});
