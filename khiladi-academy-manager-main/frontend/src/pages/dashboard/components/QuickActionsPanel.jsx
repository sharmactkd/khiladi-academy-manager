import ActionGrid from "../../../components/common/ActionGrid.jsx";

const QuickActionsPanel = ({ actions }) => <ActionGrid className="owner-panel owner-quick-actions" gridClassName="owner-quick-actions__grid" headerClassNames={{ root: "owner-panel__header", copy: "owner-panel__header-copy" }} eyebrow="Shortcuts" items={actions} title="Quick actions" />;

export default QuickActionsPanel;
