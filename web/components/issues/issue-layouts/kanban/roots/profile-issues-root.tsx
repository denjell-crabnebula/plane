import { FC, useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { DragDropContext } from "@hello-pangea/dnd";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { KanBanSwimLanes } from "../swimlanes";
import { KanBan } from "../default";
import { ProjectIssueQuickActions } from "components/issues";
// constants
import { ISSUE_STATE_GROUPS, ISSUE_PRIORITIES } from "constants/issue";
// types
import { IIssue } from "types";

export interface IProfileIssuesKanBanLayout {}

export const ProfileIssuesKanBanLayout: FC = observer(() => {
  const {
    workspace: workspaceStore,
    project: projectStore,
    profileIssues: profileIssuesStore,
    profileIssueFilters: profileIssueFiltersStore,
    issueKanBanView: issueKanBanViewStore,
    issueDetail: issueDetailStore,
  } = useMobxStore();

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const issues = profileIssuesStore?.getIssues;

  const sub_group_by: string | null = profileIssueFiltersStore?.userDisplayFilters?.sub_group_by || null;

  const group_by: string | null = profileIssueFiltersStore?.userDisplayFilters?.group_by || null;

  const displayProperties = profileIssueFiltersStore?.userDisplayProperties || null;

  const currentKanBanView: "swimlanes" | "default" = profileIssueFiltersStore?.userDisplayFilters?.sub_group_by
    ? "swimlanes"
    : "default";

  const onDragEnd = (result: any) => {
    if (!result) return;

    if (
      result.destination &&
      result.source &&
      result.destination.droppableId === result.source.droppableId &&
      result.destination.index === result.source.index
    )
      return;

    currentKanBanView === "default"
      ? issueKanBanViewStore?.handleDragDrop(result.source, result.destination)
      : issueKanBanViewStore?.handleSwimlaneDragDrop(result.source, result.destination);
  };

  const handleIssues = useCallback(
    (sub_group_by: string | null, group_by: string | null, issue: IIssue, action: "update" | "delete") => {
      if (!workspaceSlug) return;

      if (action === "update") {
        profileIssuesStore.updateIssueStructure(group_by, sub_group_by, issue);
        issueDetailStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue);
      }
      if (action === "delete") profileIssuesStore.deleteIssue(group_by, sub_group_by, issue);
    },
    [profileIssuesStore, issueDetailStore, workspaceSlug]
  );

  const handleKanBanToggle = (toggle: "groupByHeaderMinMax" | "subgroupByIssuesVisibility", value: string) => {
    issueKanBanViewStore.handleKanBanToggle(toggle, value);
  };

  const states = projectStore?.projectStates || null;
  const priorities = ISSUE_PRIORITIES || null;
  const labels = workspaceStore.workspaceLabels || null;
  const members = projectStore?.projectMembers || null;
  const stateGroups = ISSUE_STATE_GROUPS || null;
  const projects = projectStore?.workspaceProjects || null;

  return (
    <div className={`relative min-w-full w-max min-h-full h-max bg-custom-background-90 px-3`}>
      <DragDropContext onDragEnd={onDragEnd}>
        {currentKanBanView === "default" ? (
          <KanBan
            issues={issues}
            sub_group_by={sub_group_by}
            group_by={group_by}
            handleIssues={handleIssues}
            quickActions={(sub_group_by, group_by, issue) => (
              <ProjectIssueQuickActions
                issue={issue}
                handleDelete={async () => handleIssues(sub_group_by, group_by, issue, "delete")}
                handleUpdate={async (data) => handleIssues(sub_group_by, group_by, data, "update")}
              />
            )}
            displayProperties={displayProperties}
            kanBanToggle={issueKanBanViewStore?.kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
            states={states}
            stateGroups={stateGroups}
            priorities={priorities}
            labels={labels}
            members={members?.map((m) => m.member) ?? null}
            projects={projects}
            estimates={null}
          />
        ) : (
          <KanBanSwimLanes
            issues={issues}
            sub_group_by={sub_group_by}
            group_by={group_by}
            handleIssues={handleIssues}
            quickActions={(sub_group_by, group_by, issue) => (
              <ProjectIssueQuickActions
                issue={issue}
                handleDelete={async () => handleIssues(sub_group_by, group_by, issue, "delete")}
                handleUpdate={async (data) => handleIssues(sub_group_by, group_by, data, "update")}
              />
            )}
            displayProperties={displayProperties}
            kanBanToggle={issueKanBanViewStore?.kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
            states={states}
            stateGroups={stateGroups}
            priorities={priorities}
            labels={labels}
            members={members?.map((m) => m.member) ?? null}
            projects={projects}
            estimates={null}
          />
        )}
      </DragDropContext>
    </div>
  );
});
