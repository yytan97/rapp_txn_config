import * as react from "react";
import * as reactRouter from "react-router-dom";

import { Layout, layoutLoader } from "./App.js";

// import { Home, homeLoader } from "./Home.js";
import { Dashboard, dashboardLoader } from "./Dashboard.js";

import { RootErrorBoundary } from "./RootErrorBoundary.js";

import { LoginPage } from "./LoginPage.js";
import { SettingPage } from "./SettingPage.js";

import { TestDashboard } from "./TestDashboard.js";

import { TestFormPage } from "./TestFormPage.js";
import { TestDialogBoxPage } from "./TestDialogBoxPage.js";
import { TestMonacoPage } from "./TestMonacoPage.js";

import { TableListManagementPage } from "./TableListManagementPage.js";
import { TableManagementPage } from "./TableManagementPage.js";
import { EditTablePage } from "./EditTablePage.js";

import { CryptogramManagementPage } from "./CryptogramManagementPage.js";
import { CryptogramDetailPage } from "./CryptogramDetailPage.js";
import { EditCryptogramPage } from "./EditCryptogramPage.js";
import { EditCryptogramPageV2 } from "./EditCryptogramPageV2.js";

import { InstitutionManagementPage } from "./InstitutionManagementPage.js";
import { InstitutionDetailPage } from "./InstitutionDetailPage.js";
import { EditInstitutionPage } from "./EditInstitutionPage.js";
import { EditInstitutionPageV2 } from "./EditInstitutionPageV2.js";

import { ConfigurationFileManagementPage } from "./ConfigurationFileManagementPage.js";
import { EditConfigurationPage } from "./EditConfigurationPage.js";
import { ForgotPasswordPage } from "./ForgotPasswordPage.js";
import { ResetPasswordPage } from "./ResetPasswordPage.js";

import { EditRoutePage } from "./EditRoutePage.js";

import { TimerManagementPage } from "./TimerManagementPage.js";
import { TimerDetailPage } from "./TimerDetailPage.js";
import { EditTimerPage } from "./EditTimerPage.js";
import { EditTimerPageV2 } from "./EditTimerPageV2.js";

import { BINPrefixManagementPage } from "./BINPrefixManagementPage.js";
import { BINPrefixDetailPage } from "./BINPrefixDetailPage.js";
import { EditBINPrefixPage } from "./EditBINPrefixPage.js";
import { EditBINPrefixPageV2 } from "./EditBINPrefixPageV2.js";

import { SwitchInstitutionControlPage } from "./SwitchInstitutionControlPage.js";
import { SwitchLinkControlPage } from "./SwitchLinkControlPage.js";
import { SwitchServerControlPage } from "./SwitchServerControlPage.js";
import { SwitchTransactionControlPage } from "./SwitchTransactionControlPage.js";

import { ProcessControlPage } from "./ProcessControlPage.js";

import { TransactionHistoryOverviewPage } from "./TransactionHistoryOverviewPage.js";
import { TransactionHistoryDetailPage } from "./TransactionHistoryDetailPage.js";

import { SystemConfigurationDashboard } from "./SystemConfigurationDashboard.js";
import { InstitutionSettingsDashboard } from "./InstitutionSettingsDashboard.js";

import { RouteManagementPage } from "./RouteManagementPage.js";
import { RouteDetailPage } from "./RouteDetailPage.js";
import { EditRoutePageV2 } from "./EditRoutePageV2.js";

import { HotCardManagementPage } from "./HotCardManagementPage.js";
import { EditHotCardPage } from "./EditHotCardPage.js";

import { TransactionHistoryOverviewPageV2 } from "./TransactionHistoryOverviewPageV2.js";
import { TransactionHistoryDetailPageV2 } from "./TransactionHistoryDetailPageV2.js";
import { SearchBox } from "./SearchBox.js";

import { AuthenticateDashboard } from "./AuthenticateDashboard.js"
import { TeamManagementPage } from "./TeamManagementPage.js";
import { TeamDetailPage } from "./TeamDetailPage.js";

import { TestGraphPage } from "./TestGraphPage.js";
import { TestGraphPage2 } from "./TestGraphPage2.js";

export let appRouterDefination = [
    {
        path: "/",
        Component: Layout,
        loader: layoutLoader,
        errorElement: <RootErrorBoundary />,
        children: [
            {
                index: true,
                loader: dashboardLoader,
                Component: Dashboard,
            },
            {
                path: "login",
                Component: LoginPage,
            },
            {
                path: "forgotPassword",
                Component: ForgotPasswordPage,
            },
            {
                path: "resetPassword",
                Component: ResetPasswordPage,
            },
            {
                path: "cpwt",
                Component: ResetPasswordPage,
            },
            {
                path: "setting",
                Component: SettingPage,
            },
            {
                path: "tableListManagement",
                Component: TableListManagementPage,
            },
            {
                path: "tableManagement",
                Component: TableManagementPage,
            },
            {
                path: "editTable",
                Component: EditTablePage,
            },
            {
                path: "configurationFileManagement",
                Component: ConfigurationFileManagementPage,
            },
            {
                path: "editConfiguration",
                Component: EditConfigurationPage,
            },
            {
                path: "institutionManagement",
                Component: InstitutionManagementPage,
            },
            {
                path: "institutionDetail",
                Component: InstitutionDetailPage,
            },
            {
                path: "editInstitution",
                Component: EditInstitutionPage,
            },
            {
                path: "editInstitutionV2",
                Component: EditInstitutionPageV2,
            },
            {
                path: "editRoute",
                Component: EditRoutePage,
            },
            {
                path: "cryptogramManagement",
                Component: CryptogramManagementPage,
            },
            {
                path: "cryptogramDetail",
                Component: CryptogramDetailPage,
            },
            {
                path: "editCryptogram",
                Component: EditCryptogramPage,
            },
            {
                path: "editCryptogramV2",
                Component: EditCryptogramPageV2,
            },
            {
                path: "timerManagement",
                Component: TimerManagementPage,
            },
            {
                path: "timerDetail",
                Component: TimerDetailPage,
            },
            {
                path: "editTimer",
                Component: EditTimerPage,
            },
            {
                path: "editTimerV2",
                Component: EditTimerPageV2,
            },
            {
                path: "binPrefixManagement",
                Component: BINPrefixManagementPage,
            },
            {
                path: "binPrefixDetail",
                Component: BINPrefixDetailPage,
            },
            {
                path: "editBINPrefix",
                Component: EditBINPrefixPage,
            },
            {
                path: "editBINPrefixV2",
                Component: EditBINPrefixPageV2,
            },
            {
                path: "transactionHistory",
                Component: TransactionHistoryOverviewPage,
            },
            {
                path: "transactionHistoryDetail",
                Component: TransactionHistoryDetailPage,
            },
            {
                path: "switchInstitution",
                Component: SwitchInstitutionControlPage,
            },
            {
                path: "switchLink",
                Component: SwitchLinkControlPage,
            },
            {
                path: "switchTransaction",
            },
            {
                path: "switchServer",
                Component: SwitchServerControlPage,
            },
            {
                path: "processControl",
                Component: ProcessControlPage,
            },
            {
                path: "systemConfigurationDashboard",
                Component: SystemConfigurationDashboard,
            },
            {
                path: "institutionSettingsDashboard",
                Component: InstitutionSettingsDashboard,
            },
            {
                path: "routeManagement",
                Component: RouteManagementPage,
            },
            {
                path: "routeDetail",
                Component: RouteDetailPage,
            },
            {
                path: "editRouteV2",
                Component: EditRoutePageV2,
            },
            {
                path: "hotCardManagement",
                Component: HotCardManagementPage,
            },
            {
                path: "editHotCard",
                Component: EditHotCardPage,
            },
            {
                path: "transactionHistoryV2",
                Component: TransactionHistoryOverviewPageV2,
            },
            {
                path: "transactionHistoryDetailV2",
                Component: TransactionHistoryDetailPageV2,
            },
            {
                path: "searchBox",
                Component: SearchBox,
            },
            {
                path: "authenticateDashboard",
                Component: AuthenticateDashboard,
            },
            {
                path: "teamManagement",
                Component: TeamManagementPage,
            },
            {
                path: "teamDetail",
                Component: TeamDetailPage,
            },
            {
                path: "testDashboard",
                Component: TestDashboard,
            },
            {
                path: "testGraph",
                Component: TestGraphPage,
            },
            {
                path: "testGraph2",
                Component: TestGraphPage2,
            },
            {
                path: "testForm",
                element: <TestFormPage />,
            },
            {
                path: "testDialogBox",
                element: <TestDialogBoxPage />,
            },
            {
                path: "testMonaco",
                element: <TestMonacoPage />,
            },
            {
                path: "home",
                element: <reactRouter.Navigate to="/" />,
            },
            {
                path: "dashboard",
                element: <reactRouter.Navigate to="/" />,
            },
        ],
    },
];

