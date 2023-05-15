import React from "react";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// services
import cyclesService from "services/cycles.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { CustomMenu, LinearProgressIndicator, Tooltip } from "components/ui";
import { Disclosure, Transition } from "@headlessui/react";
import { AssigneesList, Avatar } from "components/ui/avatar";
import { SidebarProgressStats, SingleProgressStats } from "components/core";
// components
import ProgressChart from "components/core/sidebar/progress-chart";
// icons
import { CalendarDaysIcon, ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { getPriorityIcon } from "components/icons/priority-icon";
import {
  TargetIcon,
  ContrastIcon,
  PersonRunningIcon,
  ArrowRightIcon,
  TriangleExclamationIcon,
  AlarmClockIcon,
  LayerDiagonalIcon,
  CompletedStateIcon,
  UserGroupIcon,
  TriangleIcon,
  BacklogStateIcon,
  StartedStateIcon,
} from "components/icons";
import {
  ChevronDownIcon,
  LinkIcon,
  PencilIcon,
  StarIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
// helpers
import {
  getDateRangeStatus,
  renderShortDateWithYearFormat,
  findHowManyDaysLeft,
} from "helpers/date-time.helper";
import { copyTextToClipboard, truncateText } from "helpers/string.helper";
// types
import {
  CompletedCyclesResponse,
  CurrentAndUpcomingCyclesResponse,
  DraftCyclesResponse,
  ICycle,
  IIssue,
} from "types";
// fetch-keys
import {
  CYCLE_COMPLETE_LIST,
  CYCLE_CURRENT_AND_UPCOMING_LIST,
  CYCLE_DRAFT_LIST,
  CYCLE_ISSUES,
} from "constants/fetch-keys";

type TSingleStatProps = {
  cycle: ICycle;
  isCompleted?: boolean;
};

const stateGroups = [
  {
    key: "backlog_issues",
    title: "Backlog",
    color: "#dee2e6",
  },
  {
    key: "unstarted_issues",
    title: "Unstarted",
    color: "#26b5ce",
  },
  {
    key: "started_issues",
    title: "Started",
    color: "#f7ae59",
  },
  {
    key: "cancelled_issues",
    title: "Cancelled",
    color: "#d687ff",
  },
  {
    key: "completed_issues",
    title: "Completed",
    color: "#09a953",
  },
];
2;

export const ActiveCycleDetails: React.FC<TSingleStatProps> = ({ cycle, isCompleted = false }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const endDate = new Date(cycle.end_date ?? "");
  const startDate = new Date(cycle.start_date ?? "");

  const groupedIssues: any = {
    backlog: cycle.backlog_issues,
    unstarted: cycle.unstarted_issues,
    started: cycle.started_issues,
    completed: cycle.completed_issues,
    cancelled: cycle.cancelled_issues,
  };

  const cycleStatus = getDateRangeStatus(cycle.start_date, cycle.end_date);

  const handleAddToFavorites = () => {
    if (!workspaceSlug || !projectId || !cycle) return;

    switch (cycleStatus) {
      case "current":
      case "upcoming":
        mutate<CurrentAndUpcomingCyclesResponse>(
          CYCLE_CURRENT_AND_UPCOMING_LIST(projectId as string),
          (prevData) => ({
            current_cycle: (prevData?.current_cycle ?? []).map((c) => ({
              ...c,
              is_favorite: c.id === cycle.id ? true : c.is_favorite,
            })),
            upcoming_cycle: (prevData?.upcoming_cycle ?? []).map((c) => ({
              ...c,
              is_favorite: c.id === cycle.id ? true : c.is_favorite,
            })),
          }),
          false
        );
        break;
      case "completed":
        mutate<CompletedCyclesResponse>(
          CYCLE_COMPLETE_LIST(projectId as string),
          (prevData) => ({
            completed_cycles: (prevData?.completed_cycles ?? []).map((c) => ({
              ...c,
              is_favorite: c.id === cycle.id ? true : c.is_favorite,
            })),
          }),
          false
        );
        break;
      case "draft":
        mutate<DraftCyclesResponse>(
          CYCLE_DRAFT_LIST(projectId as string),
          (prevData) => ({
            draft_cycles: (prevData?.draft_cycles ?? []).map((c) => ({
              ...c,
              is_favorite: c.id === cycle.id ? true : c.is_favorite,
            })),
          }),
          false
        );
        break;
    }

    cyclesService
      .addCycleToFavorites(workspaceSlug as string, projectId as string, {
        cycle: cycle.id,
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Couldn't add the cycle to favorites. Please try again.",
        });
      });
  };

  const handleRemoveFromFavorites = () => {
    if (!workspaceSlug || !projectId || !cycle) return;

    switch (cycleStatus) {
      case "current":
      case "upcoming":
        mutate<CurrentAndUpcomingCyclesResponse>(
          CYCLE_CURRENT_AND_UPCOMING_LIST(projectId as string),
          (prevData) => ({
            current_cycle: (prevData?.current_cycle ?? []).map((c) => ({
              ...c,
              is_favorite: c.id === cycle.id ? false : c.is_favorite,
            })),
            upcoming_cycle: (prevData?.upcoming_cycle ?? []).map((c) => ({
              ...c,
              is_favorite: c.id === cycle.id ? false : c.is_favorite,
            })),
          }),
          false
        );
        break;
      case "completed":
        mutate<CompletedCyclesResponse>(
          CYCLE_COMPLETE_LIST(projectId as string),
          (prevData) => ({
            completed_cycles: (prevData?.completed_cycles ?? []).map((c) => ({
              ...c,
              is_favorite: c.id === cycle.id ? false : c.is_favorite,
            })),
          }),
          false
        );
        break;
      case "draft":
        mutate<DraftCyclesResponse>(
          CYCLE_DRAFT_LIST(projectId as string),
          (prevData) => ({
            draft_cycles: (prevData?.draft_cycles ?? []).map((c) => ({
              ...c,
              is_favorite: c.id === cycle.id ? false : c.is_favorite,
            })),
          }),
          false
        );
        break;
    }

    cyclesService
      .removeCycleFromFavorites(workspaceSlug as string, projectId as string, cycle.id)
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Couldn't remove the cycle from favorites. Please try again.",
        });
      });
  };

  const { data: issues } = useSWR<IIssue[]>(
    workspaceSlug && projectId && cycle.id ? CYCLE_ISSUES(cycle.id as string) : null,
    workspaceSlug && projectId && cycle.id
      ? () =>
          cyclesService.getCycleIssues(
            workspaceSlug as string,
            projectId as string,
            cycle.id as string
          )
      : null
  );

  const progressIndicatorData = stateGroups.map((group, index) => ({
    id: index,
    name: group.title,
    value:
      cycle.total_issues > 0
        ? ((cycle[group.key as keyof ICycle] as number) / cycle.total_issues) * 100
        : 0,
    color: group.color,
  }));
  console.log("High Priority Issue", cycle);
  return (
    <div className="grid-row-2 grid divide-y rounded-lg border border-brand-base bg-brand-base shadow">
      <div className="grid grid-cols-1 divide-y border-brand-base lg:grid-cols-3 lg:divide-y-0 lg:divide-x">
        {/* section 1 */}
        <div className="flex flex-col text-xs">
          <a className="w-full">
            <div className="flex h-full flex-col gap-5 rounded-b-[10px] p-4">
              <div className="flex items-center justify-between gap-1">
                <span className="flex items-center gap-1">
                  <ContrastIcon
                    className="h-5 w-5 flex-shrink-0"
                    color={`${
                      cycleStatus === "current"
                        ? "#09A953"
                        : cycleStatus === "upcoming"
                        ? "#F7AE59"
                        : cycleStatus === "completed"
                        ? "#3F76FF"
                        : cycleStatus === "draft"
                        ? "#858E96"
                        : ""
                    }`}
                  />
                  <Tooltip tooltipContent={cycle.name} position="top-left">
                    <h3 className="break-all text-lg font-semibold">
                      {truncateText(cycle.name, 70)}
                    </h3>
                  </Tooltip>
                </span>
                <span className="flex items-center gap-1 capitalize">
                  <span
                    className={`rounded-full px-1.5 py-0.5
                    ${
                      cycleStatus === "current"
                        ? "bg-green-600/5 text-green-600"
                        : cycleStatus === "upcoming"
                        ? "bg-orange-300/5 text-orange-300"
                        : cycleStatus === "completed"
                        ? "bg-blue-500/5 text-blue-500"
                        : cycleStatus === "draft"
                        ? "bg-neutral-400/5 text-neutral-400"
                        : ""
                    }`}
                  >
                    {cycleStatus === "current" ? (
                      <span className="flex gap-1">
                        <PersonRunningIcon className="h-4 w-4" />
                        {findHowManyDaysLeft(cycle.end_date ?? new Date())} Days Left
                      </span>
                    ) : cycleStatus === "upcoming" ? (
                      <span className="flex gap-1">
                        <AlarmClockIcon className="h-4 w-4" />
                        {findHowManyDaysLeft(cycle.start_date ?? new Date())} Days Left
                      </span>
                    ) : cycleStatus === "completed" ? (
                      <span className="flex gap-1">
                        {cycle.total_issues - cycle.completed_issues > 0 && (
                          <Tooltip
                            tooltipContent={`${
                              cycle.total_issues - cycle.completed_issues
                            } more pending ${
                              cycle.total_issues - cycle.completed_issues === 1 ? "issue" : "issues"
                            }`}
                          >
                            <span>
                              <TriangleExclamationIcon className="h-4 w-4" />
                            </span>
                          </Tooltip>
                        )}{" "}
                        Completed
                      </span>
                    ) : (
                      cycleStatus
                    )}
                  </span>
                  {cycle.is_favorite ? (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemoveFromFavorites();
                      }}
                    >
                      <StarIcon
                        className="h-4 w-4 text-orange-400"
                        fill={cycle.is_favorite ? "#f6ad55" : "#858E96"}
                      />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddToFavorites();
                      }}
                    >
                      <StarIcon className="h-4 w-4 " color="#858E96" />
                    </button>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-start gap-5 text-brand-secondary">
                <div className="flex items-start gap-1 ">
                  <CalendarDaysIcon className="h-4 w-4 text-brand-base" />
                  <span>{renderShortDateWithYearFormat(startDate)}</span>
                </div>
                <ArrowRightIcon className="h-4 w-4 text-brand-secondary" />
                <div className="flex items-start gap-1 ">
                  <TargetIcon className="h-4 w-4 text-brand-base" />
                  <span>{renderShortDateWithYearFormat(endDate)}</span>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2.5 text-brand-secondary">
                  {cycle.owned_by.avatar && cycle.owned_by.avatar !== "" ? (
                    <Image
                      src={cycle.owned_by.avatar}
                      height={16}
                      width={16}
                      className="rounded-full"
                      alt={cycle.owned_by.first_name}
                    />
                  ) : (
                    <span className="bg-brand-secondary flex h-5 w-5 items-center justify-center rounded-full bg-brand-base  capitalize">
                      {cycle.owned_by.first_name.charAt(0)}
                    </span>
                  )}
                  <span className="text-brand-base">{cycle.owned_by.first_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-brand-secondary">
                    {cycle.owned_by.avatar && cycle.owned_by.avatar !== "" ? (
                      <Image
                        src={cycle.owned_by.avatar}
                        height={16}
                        width={16}
                        className="rounded-full"
                        alt={cycle.owned_by.first_name}
                      />
                    ) : (
                      <span className="bg-brand-secondary flex h-5 w-5 items-center justify-center rounded-full bg-brand-base  capitalize">
                        {cycle.owned_by.first_name.charAt(0)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="flex gap-2">
                  <LayerDiagonalIcon className="h-4 w-4 flex-shrink-0 text-brand-secondary" />
                  {cycle.total_issues} issues
                </div>
                <div className="flex gap-2">
                  <CompletedStateIcon width={16} height={16} color="#438AF3" />
                  {cycle.completed_issues} issues
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="whitespace-nowrap">Estimates Scope</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 border text-brand-secondary rounded-full px-1.5 py-0.5">
                    <BacklogStateIcon className="h-4 w-4 flex-shrink-0 text-brand-secondary" />
                    <TriangleIcon
                      className="h-3 w-3 flex-shrink-0 text-brand-secondary"
                      color="#858E96"
                    />
                    <div className="font-bold">{cycle.total_issues}</div>
                  </div>
                  <div className="flex items-center gap-1 border border-orange-300 bg-orange-300/5 text-orange-300 rounded-full px-1.5 py-0.5">
                    <StartedStateIcon className="h-4 w-4 flex-shrink-0 text-brand-secondary" />
                    <TriangleIcon
                      className="h-3 w-3 flex-shrink-0 text-brand-secondary"
                      color="#FCBE1D"
                    />
                    <div className="font-bold">{cycle.total_issues}</div>
                  </div>
                  <div className="flex items-center gap-1 border border-blue-500 bg-blue-500/5 text-blue-500 rounded-full px-1.5 py-0.5">
                    <CompletedStateIcon width={16} height={16} color="#438AF3" />
                    <TriangleIcon
                      className="h-3 w-3 flex-shrink-0 text-brand-secondary"
                      color="#438AF3"
                    />
                    <div className="font-bold">{cycle.completed_issues}</div>
                  </div>
                </div>
              </div>
            </div>
          </a>
        </div>
        {/* section 2 */}
        <div className="flex h-full flex-col border-brand-base">
          <div className={`mt-3 flex h-full w-full flex-col text-brand-secondary`}>
            <div className="mb-2 flex w-full items-center gap-2 px-4 py-1">
              <span>Progress</span>
              <LinearProgressIndicator data={progressIndicatorData} />
            </div>
            <div className="ml-2 space-y-2.5 pb-2.5">
              {Object.keys(groupedIssues).map((group, index) => (
                <SingleProgressStats
                  key={index}
                  title={
                    <div className="flex items-center gap-2">
                      <span
                        className="block h-3 w-3 rounded-full "
                        style={{
                          backgroundColor: stateGroups[index].color,
                        }}
                      />
                      <span className="text-xs capitalize">{group}</span>
                    </div>
                  }
                  completed={groupedIssues[group]}
                  total={cycle.total_issues}
                />
              ))}
            </div>
          </div>
        </div>
        {/* section 3 */}
        <div className="border-brand-base p-2">
          <SidebarProgressStats
            issues={issues ?? []}
            groupedIssues={{
              backlog: cycle.backlog_issues,
              unstarted: cycle.unstarted_issues,
              started: cycle.started_issues,
              completed: cycle.completed_issues,
              cancelled: cycle.cancelled_issues,
            }}
            display_states={false}
          />
        </div>
      </div>
      <div className="grid divide-y border-brand-base lg:grid-cols-2 lg:divide-y-0 lg:divide-x">
        {/* section 4 */}
        <div className="p-4">
          <div className="text-brand-primary mb-2 font-medium">High Priority Issues</div>
          <div className="mb-2 flex max-h-[260px] min-h-[280px] flex-col space-y-3 overflow-y-scroll rounded-md">
            {issues
              ?.filter((issue) => issue.priority === "urgent" || issue.priority === "high")
              .map((issue) => (
                <div
                  key={issue.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-base bg-brand-surface-1 p-2.5"
                >
                  <div className="flex-grow">
                    <div>
                      <Tooltip
                        tooltipHeading="Issue ID"
                        tooltipContent={`${issue.project_detail?.identifier}-${issue.sequence_id}`}
                      >
                        <span className="flex-shrink-0 text-xs text-brand-secondary">
                          {issue.project_detail?.identifier}-{issue.sequence_id}
                        </span>
                      </Tooltip>
                    </div>
                    <Tooltip position="top-left" tooltipHeading="Title" tooltipContent={issue.name}>
                      <span className="line-clamp-1 text-sm font-medium text-brand-base">
                        {truncateText(issue.name, 25)}
                      </span>
                    </Tooltip>
                  </div>
                  <div
                    className={`grid h-6 w-6 place-items-center items-center rounded border shadow-sm ${
                      issue.priority === "urgent"
                        ? "border-red-500/20 bg-red-500/20 text-red-500"
                        : issue.priority === "high"
                        ? "border-orange-500/20 bg-orange-500/20 text-orange-500"
                        : issue.priority === "medium"
                        ? "border-yellow-500/20 bg-yellow-500/20 text-yellow-500"
                        : issue.priority === "low"
                        ? "border-green-500/20 bg-green-500/20 text-green-500"
                        : "border-brand-base"
                    }`}
                  >
                    {getPriorityIcon(issue.priority, "text-sm")}
                  </div>
                  {issue.label_details.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {issue.label_details.map((label) => (
                        <span
                          key={label.id}
                          className="group flex items-center gap-1 rounded-2xl border border-brand-base px-2 py-0.5 text-xs text-brand-secondary"
                        >
                          <span
                            className="h-1.5 w-1.5  rounded-full"
                            style={{
                              backgroundColor:
                                label?.color && label.color !== "" ? label.color : "#000",
                            }}
                          />
                          {label.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    ""
                  )}
                  <div className={`flex items-center gap-2 text-brand-secondary`}>
                    {issue.assignees &&
                    issue.assignees.length > 0 &&
                    Array.isArray(issue.assignees) ? (
                      <div className="-my-0.5 flex items-center justify-center gap-2">
                        <AssigneesList userIds={issue.assignees} length={3} showLength={false} />
                      </div>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
              ))}
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="h-1 w-full rounded-full bg-neutral-200">
              <div
                className="h-1 rounded-full bg-green-600"
                style={{
                  width:
                    issues &&
                    `${
                      issues?.filter(
                        (issue) =>
                          issue?.state_detail?.group === "completed" &&
                          (issue?.priority === "urgent" || issue?.priority === "high")
                      )?.length /
                        issues?.filter(
                          (issue) => issue?.priority === "urgent" || issue?.priority === "high"
                        )?.length * 100 ?? 0
                    }%`,
                }}
              />
            </div>
            <div className="w-16 text-end text-xs text-brand-secondary">
              {
                issues?.filter(
                  (issue) =>
                    issue?.state_detail?.group === "completed" &&
                    (issue?.priority === "urgent" || issue?.priority === "high")
                )?.length
              }{" "}
              of{" "}
              {
                issues?.filter(
                  (issue) => issue?.priority === "urgent" || issue?.priority === "high"
                )?.length
              }
            </div>
          </div>
        </div>
        {/* section 5 */}
        <div className="border-brand-base p-4">
          <div className="flex items-start justify-between gap-4 py-2 text-xs">
            <div className="flex items-center gap-3 text-brand-base">
              <div className="flex items-center justify-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-[#A9BBD0]" />
                <span>Ideal</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-[#4C8FFF]" />
                <span>Current</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span>
                <LayerDiagonalIcon className="h-5 w-5 flex-shrink-0 text-brand-secondary" />
              </span>
              <span>
                Pending Issues -{" "}
                {cycle.total_issues - (cycle.completed_issues + cycle.cancelled_issues)}
              </span>
            </div>
          </div>
          <div className="relative h-72">
            <ProgressChart
              issues={issues ?? []}
              start={cycle?.start_date ?? ""}
              end={cycle?.end_date ?? ""}
              width={550}
              height={250}
            />
          </div>
        </div>
      </div>
    </div>
  );
};