import Link from "next/link";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Draggable } from "@hello-pangea/dnd";
// types
import { IIssue } from "types";

type Props = {
  issues: IIssue[] | null;
  quickActions: (issue: IIssue) => React.ReactNode;
};

export const CalendarIssueBlocks: React.FC<Props> = observer((props) => {
  const { issues, quickActions } = props;

  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <>
      {issues?.map((issue, index) => (
        <Draggable key={issue.id} draggableId={issue.id} index={index}>
          {(provided, snapshot) => (
            <div
              className="p-1 px-2 relative"
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              ref={provided.innerRef}
            >
              {issue?.tempId !== undefined && (
                <div className="absolute top-0 left-0 w-full h-full animate-pulse bg-custom-background-100/20 z-[99999]" />
              )}
              <Link href={`/${workspaceSlug?.toString()}/projects/${issue.project}/issues/${issue.id}`}>
                <a
                  className={`group/calendar-block h-8 w-full shadow-custom-shadow-2xs rounded py-1.5 px-1 flex items-center gap-1.5 border-[0.5px] border-custom-border-100 ${
                    snapshot.isDragging
                      ? "shadow-custom-shadow-rg bg-custom-background-90"
                      : "bg-custom-background-100 hover:bg-custom-background-90"
                  }`}
                >
                  <span
                    className="h-full w-0.5 rounded flex-shrink-0"
                    style={{
                      backgroundColor: issue.state_detail.color,
                    }}
                  />
                  <div className="text-xs text-custom-text-300 flex-shrink-0">
                    {issue.project_detail.identifier}-{issue.sequence_id}
                  </div>
                  <h6 className="text-xs flex-grow truncate">{issue.name}</h6>
                  <div className="hidden group-hover/calendar-block:block">{quickActions(issue)}</div>
                </a>
              </Link>
            </div>
          )}
        </Draggable>
      ))}
    </>
  );
});
