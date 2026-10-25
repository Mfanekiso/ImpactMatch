import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Platform, Animated, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { navigationRef } from "./navigationRef";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@react-native-vector-icons/ionicons";

// Import all the screens that will be used in the app navigator
import WelcomeScreen from "../screens/auth/WelcomeScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import SignUpScreen from "../screens/auth/SignUpScreen";
import UserTypeScreen from "../screens/auth/UserTypeScreen";
import NGOSetupScreen from "../screens/ngo/NGOSetupScreen";
import NGOHomeScreen from "../screens/ngo/NGOHomeScreen";
import MatchesScreen from "../screens/ngo/MatchesScreen";
import MessagesScreen from "../screens/ngo/MessagesScreen";
import SponsorSearchScreen from "../screens/ngo/SponsorSearchScreen";
import SponsorDetailsScreen from "../screens/ngo/SponsorDetailsScreen";
import ImpactScreen from "../screens/ngo/ImpactScreen";
import NGOProfileScreen from "../screens/ngo/NGOProfileScreen";
import OpportunitiesScreen from "../screens/ngo/OpportunitiesScreen";
import SponsorNavigator from "./SponsorNavigator";
import SponsorSetupScreen from "../screens/sponsors/SponsorSetupScreen";
import SponsorMatchDetailsScreen from "../screens/sponsors/SponsorMatchDetailsScreen";
import NewChat from "../screens/sponsors/NewChat";
import ChatScreen from "../screens/sponsors/ChatScreen";
import SponsorOpportunityDetailsScreen from "../screens/sponsors/SponsorOpportunityDetailsScreen";
import CreateOpportunityScreen from "../screens/ngo/CreateOpportunityScreen";
import useUnreadMessages from "../hooks/useUnreadMessages";

// Initialize Navigators
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ─── LUXURY COLOR PALETTE (NGO Side) ──────────────────────────────────────
const COLORS = {
    background: "#FFFFFF",
    border: "#D9C982",           // Nice Solid Gold border for the nav
    activeBg: "#433327",         // Warm Bronze (Distinct from Sponsor's Dark Green)
    activeIcon: "#D9C982",       // Luxury Gold
    inactiveIcon: "#8C7A6B",     // Muted Taupe
    danger: "#DC2626",           // Elegant Red for badges
};

const TAB_ICONS = {
    Home: ["home", "home-outline"],
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
            useNativeDriver: true,
        }).start();
    }, [focused]);

    const icons = TAB_ICONS[routeName];
    const iconName = focused ? icons[0] : icons[1];

    return (
        <Animated.View style={[tabStyles.iconWrap, { transform: [{ scale: scaleAnim }] }]}>
            <View style={[tabStyles.iconBackground, focused && tabStyles.iconBackgroundActive]}>
                <Ionicons
                    name={iconName}
                    size={22}
                    color={focused ? COLORS.activeIcon : COLORS.inactiveIcon}
                />
            </View>
        </Animated.View>
    );
};

// 1. Create the Tab Navigator for post-login screens
function MainTabs({ route }) {
    const unreadCount = useUnreadMessages();
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: tabStyles.tabBar,
                tabBarItemStyle: tabStyles.tabItem,
                tabBarShowLabel: true,
                tabBarHideOnKeyboard: true,
                
                tabBarIcon: ({ focused }) => (
                    <AnimatedTabIcon focused={focused} routeName={route.name} />
                ),
                
                tabBarLabel: ({ focused }) => (
                    <Text style={[tabStyles.tabLabel, focused && tabStyles.tabLabelActive]}>
                        {route.name}
                    </Text>
                ),
            })}
        >
            <Tab.Screen
                name="Home"
                component={NGOHomeScreen}
                initialParams={route?.params?.params || route?.params}
            />

            <Tab.Screen
                name="Matches"
                component={MatchesScreen}
            />

            <Tab.Screen
                name="Messages"
                component={MessagesScreen}
                options={{
                    tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
                    tabBarBadgeStyle: tabStyles.unreadBadge,
                }}
            />

            <Tab.Screen
                name="Impact"
                component={ImpactScreen}
            />

            {/* Hidden Profile Tab (Access via Header Avatar) */}
            <Tab.Screen
                name="Profile"
                component={NGOProfileScreen}
                options={{
                    tabBarItemStyle: { display: "none" },
                    tabBarButton: () => null,
                }}
            />
        </Tab.Navigator>
    );
}

// 2. Main App Navigator
export default function AppNavigator({ initialRouteName = "Welcome", initialRouteParams }) {
    return (
        <NavigationContainer ref={navigationRef}>
            <Stack.Navigator
                initialRouteName={initialRouteName}
                screenOptions={{
                    headerShown: false,
                }}
            >
                {/* Auth & Onboarding Screens (No Bottom Bar) */}
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="SignUp" component={SignUpScreen} />
                <Stack.Screen name="UserType" component={UserTypeScreen} initialParams={initialRouteName === "UserType" ? initialRouteParams : undefined} />
                <Stack.Screen name="NGOSetup" component={NGOSetupScreen} initialParams={initialRouteName === "NGOSetup" ? initialRouteParams : undefined} />
                <Stack.Screen name="SponsorSetup" component={SponsorSetupScreen} initialParams={initialRouteName === "SponsorSetup" ? initialRouteParams : undefined} />

                {/* The Main App (With Bottom Bar) */}
                <Stack.Screen name="MainTabs" component={MainTabs} initialParams={initialRouteName === "MainTabs" ? initialRouteParams : undefined} />
                <Stack.Screen name="SponsorTabs" component={SponsorNavigator} initialParams={initialRouteName === "SponsorTabs" ? initialRouteParams : undefined} />
                <Stack.Screen name="NGOProfile" component={NGOProfileScreen} />
                <Stack.Screen name="CreateOpportunity" component={CreateOpportunityScreen} />
                <Stack.Screen name="SponsorSearch" component={SponsorSearchScreen} />

                {/* Detail Screens (cover the bottom bar when opened) */}
                <Stack.Screen name="SponsorDetails" component={SponsorDetailsScreen} />
                <Stack.Screen name="SponsorMatchDetails" component={SponsorMatchDetailsScreen} />
                <Stack.Screen name="NewChat" component={NewChat} />
                <Stack.Screen name="Chat" component={ChatScreen} />
                <Stack.Screen name="SponsorOpportunityDetails" component={SponsorOpportunityDetailsScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

// ─── STYLES ─────────────────────────────────────────────────────────────
const tabStyles = StyleSheet.create({
    tabBar: {
        position: "absolute",
        left: 16,
        right: 16,
        bottom: Platform.OS === "ios" ? 24 : 16,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.background,
        borderWidth: 1.5, // Slightly thicker border to show off the gold
        borderColor: COLORS.border,
        paddingBottom: 0,
        elevation: 8,
        shadowColor: "#D9C982", // Gold tinted shadow for extra elegance
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
    },
    tabItem: {
        flex: 1,
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
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent",
    },
    iconBackgroundActive: {
        backgroundColor: COLORS.activeBg,
    },
    tabLabel: {
        fontSize: 10,
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
        marginTop: 6,
    },
});