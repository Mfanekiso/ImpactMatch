import React, { useEffect, useRef } from "react";
import { Platform, StyleSheet, View, Text, Animated } from "react-native";
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

// ─── LUXURY COLOR PALETTE ───────────────────────────────────────────────
const COLORS = {
    background: "#FFFFFF",
    border: "#E8DFD5",
    activeBg: "#013e37",         // Deep Luxury Green
    activeIcon: "#D9C982",       // Luxury Gold
    inactiveIcon: "#8C7A6B",     // Muted Taupe
    danger: "#DC2626",           // Elegant Red for badges
};

const TAB_ICONS = {
    Home: ["home", "home-outline"],
    Discover: ["compass", "compass-outline"],
    Matches: ["people", "people-outline"],
    Messages: ["chatbubbles", "chatbubbles-outline"],
    Impact: ["analytics", "analytics-outline"],
};

// ─── ANIMATED TAB ICON COMPONENT ────────────────────────────────────────
const AnimatedTabIcon = ({ focused, routeName }) => {
    // Subtle spring animation expanding the icon wrapper
    const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0.85)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: focused ? 1 : 0.85,
            friction: 5,
            tension: 80,
            // useNativeDriver: true,
            useNativeDriver: Platform.OS !== 'web'
        }).start();
    }, [focused]);

    const icons = TAB_ICONS[routeName];
    const iconName = focused ? icons[0] : icons[1];

    return (
        <Animated.View style={[styles.iconWrap, { transform: [{ scale: scaleAnim }] }]}>
            <View style={[styles.iconBackground, focused && styles.iconBackgroundActive]}>
                <Ionicons
                    name={iconName}
                    size={22} // Restored larger, comfortable size
                    color={focused ? COLORS.activeIcon : COLORS.inactiveIcon}
                />
            </View>
        </Animated.View>
    );
};

// ─── NAVIGATOR ──────────────────────────────────────────────────────────
export default function SponsorNavigator({ route }) {
    const unreadCount = useUnreadMessages();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarItemStyle: styles.tabItem,
                tabBarShowLabel: true,
                tabBarHideOnKeyboard: true,
                
                tabBarIcon: ({ focused }) => (
                    <AnimatedTabIcon focused={focused} routeName={route.name} />
                ),
                
                tabBarLabel: ({ focused }) => (
                    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                        {route.name}
                    </Text>
                ),
            })}
        >
            <Tab.Screen name="Home" component={SponsorHomeScreen} initialParams={route?.params?.params || route?.params} />
            <Tab.Screen name="Discover" component={SponsorDiscoverScreen} />
            <Tab.Screen name="Matches" component={SponsorMatchesScreen} />
            <Tab.Screen 
                name="Messages" 
                component={SponsorMessagesScreen} 
                options={{ 
                    tabBarBadge: unreadCount > 0 ? unreadCount : undefined, 
                    tabBarBadgeStyle: styles.unreadBadge 
                }} 
            />
            <Tab.Screen name="Impact" component={SponsorImpactScreen} />
            
            {/* Hidden Profile Tab */}
            <Tab.Screen
                name="Profile"
                component={SponsorProfileScreen}
                options={{ 
                    // This explicitly removes the phantom empty space on the right!
                    tabBarItemStyle: { display: "none" },
                    tabBarButton: () => null 
                }}
            />
        </Tab.Navigator>
    );
}

// ─── STYLES ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    tabBar: {
        position: "absolute",
        left: 16,
        right: 16,
        bottom: Platform.OS === "ios" ? 24 : 16,
        height: 72, // Taller for a better tap target
        borderRadius: 36, // Perfect pill shape matching the height
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingBottom: 0, 
        elevation: 8, 
        shadowColor: "#433327", 
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
    },
    tabItem: {
        flex: 1, // Forces even distribution of the 5 visible tabs
        paddingTop: 8,
        paddingBottom: 6,
        alignItems: "center",
        justifyContent: "center",
    },
    iconWrap: {
        alignItems: "center",
        justifyContent: "center",
    },
    iconBackground: {
        width: 48,
        height: 32, // Creates a nice wide pill background for the active icon
        borderRadius: 16, 
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent",
    },
    iconBackgroundActive: {
        backgroundColor: COLORS.activeBg,
    },
    tabLabel: {
        fontSize: 10, // Highly readable size
        fontFamily: "Manrope_600SemiBold",
        color: COLORS.inactiveIcon,
        marginTop: 4,
    },
    tabLabelActive: {
        fontFamily: "Manrope_700Bold",
        color: COLORS.activeBg,
    },
    unreadBadge: {
        backgroundColor: COLORS.danger,
        color: COLORS.white,
        fontSize: 10,
        fontWeight: "700",
        minWidth: 18,
        height: 18,
        lineHeight: 18,
        borderRadius: 9,
        marginTop: 6, // Sits perfectly over the wider icon background
    },
});