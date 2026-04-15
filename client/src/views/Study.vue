<template>
  <v-container fluid>
    <AlertBanner :showAdminEmail="true" />
    <ConfirmDlg ref="confirmD" />

    <!-- ============================================ -->
    <!-- STATE 1: Study Cards Grid (no study selected) -->
    <!-- ============================================ -->
    <div v-if="!currentStudy.id">
      <v-card class="ds-card mb-6" variant="flat">
        <v-toolbar color="transparent" density="compact" class="px-2">
          <v-icon class="mr-2" color="primary">mdi-flask-outline</v-icon>
          <span
            class="text-subtitle-1 font-weight-bold"
            style="
              font-family: var(--ds-font-family-heading);
              color: rgb(var(--v-theme-primary));
            "
          >
            Study Management
          </span>

          <v-spacer></v-spacer>

          <v-btn
            color="success"
            variant="tonal"
            prepend-icon="mdi-plus"
            @click.stop="createStudy"
            :disabled="!canCreateStudy"
          >
            New Study
          </v-btn>

          <v-spacer></v-spacer>

          <v-text-field
            v-model="search"
            placeholder="Search by Study Name..."
            density="compact"
            variant="outlined"
            hide-details
            prepend-inner-icon="mdi-magnify"
            style="max-width: 300px; background-color: white"
            class="mr-4"
          ></v-text-field>

          <v-switch
            v-model="inProgressStudyFilter"
            label="In Progress Only"
            color="primary"
            hide-details
            density="compact"
            class="mr-4"
          ></v-switch>

          <v-select
            v-model="groupBy"
            :items="groupByOptions"
            item-title="label"
            item-value="value"
            placeholder="Group By"
            density="compact"
            variant="outlined"
            hide-details
            prepend-inner-icon="mdi-format-list-group"
            style="max-width: 200px; background-color: white"
            class="mr-4"
          ></v-select>
        </v-toolbar>
      </v-card>

      <!-- Grouped layout -->
      <template v-if="groupBy !== 'none'">
        <div v-for="group in groupedStudies" :key="group.label" class="mb-6">
          <div class="d-flex align-center mb-3 mt-2">
            <v-icon size="20" color="primary" class="mr-2">{{ groupByIcon }}</v-icon>
            <h3
              class="text-subtitle-1 font-weight-bold"
              style="
                font-family: var(--ds-font-family-heading);
                color: rgb(var(--v-theme-primary));
              "
            >
              {{ group.label }}
            </h3>
            <v-chip size="x-small" variant="tonal" color="primary" class="ml-2">{{
              group.studies.length
            }}</v-chip>
          </div>
          <v-row>
            <v-col
              cols="12"
              sm="6"
              md="4"
              lg="3"
              v-for="study in group.studies"
              :key="study.id"
            >
              <v-card
                class="ds-card ds-interactive h-100 d-flex flex-column"
                variant="flat"
                @click="rowSelected(null, { item: study })"
              >
                <v-card-title
                  class="d-flex justify-space-between align-start pt-4"
                  style="white-space: normal; line-height: 1.3"
                >
                  <span
                    class="text-h6 font-weight-bold"
                    style="
                      font-family: var(--ds-font-family-heading);
                      color: var(--color-primary);
                      font-size: 1.15rem;
                    "
                  >
                    {{ study.StudyName }}
                  </span>
                </v-card-title>
                <v-card-subtitle class="pb-3 mt-1">
                  <v-chip size="small" variant="tonal" color="primary" class="mr-2">{{
                    study.StudyType
                  }}</v-chip>
                  <v-chip
                    size="small"
                    :color="study.Completed ? 'success' : 'warning'"
                    variant="flat"
                    class="text-white font-weight-bold"
                  >
                    {{ study.Completed ? "Completed" : "In Progress" }}
                  </v-chip>
                </v-card-subtitle>
                <v-card-text class="flex-grow-1 pt-2">
                  <div class="d-flex align-center mb-2">
                    <v-icon size="18" class="mr-3" color="grey">mdi-account-star</v-icon>
                    <span class="text-body-1 font-weight-medium">{{
                      study.PointofContact?.Name || "No Contact Set"
                    }}</span>
                  </div>
                  <div class="d-flex align-center mb-2">
                    <v-icon size="18" class="mr-3" color="grey">mdi-human-child</v-icon>
                    <span class="text-body-1 text-muted">
                      <template v-if="study.AgeGroups && study.AgeGroups.length > 0">
                        <span v-for="(group, i) in study.AgeGroups" :key="i"
                          >{{ AgeFormated(group.MinAge) }}–{{ AgeFormated(group.MaxAge)
                          }}<span v-if="i < study.AgeGroups.length - 1">, </span></span
                        >
                      </template>
                      <template v-else>Age range not set</template>
                    </span>
                  </div>
                  <div class="d-flex align-center">
                    <v-icon size="18" class="mr-3" color="grey">mdi-door-open</v-icon>
                    <span class="text-body-1 text-muted text-truncate">{{
                      getRoomName(study.FK_TestingRoom)
                    }}</span>
                  </div>
                </v-card-text>
                <v-divider></v-divider>
                <v-card-actions
                  class="pa-3 bg-grey-lighten-4 d-flex justify-space-between align-center"
                >
                  <span class="text-body-2 text-muted font-weight-bold"
                    >ID: {{ study.id }}</span
                  >
                  <v-btn
                    size="small"
                    color="primary"
                    variant="text"
                    append-icon="mdi-arrow-right"
                    class="text-none"
                    >Manage</v-btn
                  >
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </div>
        <v-col cols="12" v-if="filteredStudies.length === 0">
          <v-card class="ds-card text-center py-12" variant="flat">
            <v-icon size="64" color="grey-lighten-2" class="mb-4"
              >mdi-flask-empty-outline</v-icon
            >
            <h3 class="text-h6 text-muted">No studies found</h3>
            <p class="text-body-2 text-muted">
              Try adjusting your search or filter settings.
            </p>
          </v-card>
        </v-col>
      </template>

      <!-- Flat layout (no grouping) -->
      <template v-else>
        <v-row>
          <v-col
            cols="12"
            sm="6"
            md="4"
            lg="3"
            v-for="study in filteredStudies"
            :key="study.id"
          >
            <v-card
              class="ds-card ds-interactive h-100 d-flex flex-column"
              variant="flat"
              @click="rowSelected(null, { item: study })"
            >
              <v-card-title
                class="d-flex justify-space-between align-start pt-4"
                style="white-space: normal; line-height: 1.3"
              >
                <span
                  class="text-h6 font-weight-bold"
                  style="
                    font-family: var(--ds-font-family-heading);
                    color: var(--color-primary);
                    font-size: 1.15rem;
                  "
                >
                  {{ study.StudyName }}
                </span>
              </v-card-title>
              <v-card-subtitle class="pb-3 mt-1">
                <v-chip size="small" variant="tonal" color="primary" class="mr-2">{{
                  study.StudyType
                }}</v-chip>
                <v-chip
                  size="small"
                  :color="study.Completed ? 'success' : 'warning'"
                  variant="flat"
                  class="text-white font-weight-bold"
                >
                  {{ study.Completed ? "Completed" : "In Progress" }}
                </v-chip>
              </v-card-subtitle>
              <v-card-text class="flex-grow-1 pt-2">
                <div class="d-flex align-center mb-2">
                  <v-icon size="18" class="mr-3" color="grey">mdi-account-star</v-icon>
                  <span class="text-body-1 font-weight-medium">{{
                    study.PointofContact?.Name || "No Contact Set"
                  }}</span>
                </div>
                <div class="d-flex align-center mb-2">
                  <v-icon size="18" class="mr-3" color="grey">mdi-human-child</v-icon>
                  <span class="text-body-1 text-muted">
                    <template v-if="study.AgeGroups && study.AgeGroups.length > 0">
                      <span v-for="(group, i) in study.AgeGroups" :key="i"
                        >{{ AgeFormated(group.MinAge) }}–{{ AgeFormated(group.MaxAge)
                        }}<span v-if="i < study.AgeGroups.length - 1">, </span></span
                      >
                    </template>
                    <template v-else>Age range not set</template>
                  </span>
                </div>
                <div class="d-flex align-center">
                  <v-icon size="18" class="mr-3" color="grey">mdi-door-open</v-icon>
                  <span class="text-body-1 text-muted text-truncate">{{
                    getRoomName(study.FK_TestingRoom)
                  }}</span>
                </div>
              </v-card-text>
              <v-divider></v-divider>
              <v-card-actions
                class="pa-3 bg-grey-lighten-4 d-flex justify-space-between align-center"
              >
                <span class="text-body-2 text-muted font-weight-bold"
                  >ID: {{ study.id }}</span
                >
                <v-btn
                  size="small"
                  color="primary"
                  variant="text"
                  append-icon="mdi-arrow-right"
                  class="text-none"
                  >Manage</v-btn
                >
              </v-card-actions>
            </v-card>
          </v-col>

          <v-col cols="12" v-if="filteredStudies.length === 0">
            <v-card class="ds-card text-center py-12" variant="flat">
              <v-icon size="64" color="grey-lighten-2" class="mb-4"
                >mdi-flask-empty-outline</v-icon
              >
              <h3 class="text-h6 text-muted">No studies found</h3>
              <p class="text-body-2 text-muted">
                Try adjusting your search or filter settings.
              </p>
            </v-card>
          </v-col>
        </v-row>
      </template>
    </div>

    <!-- ============================================ -->
    <!-- STATE 2: Full-Width Detail View (study selected) -->
    <!-- ============================================ -->
    <div v-else>
      <!-- Back navigation -->
      <v-btn
        variant="text"
        prepend-icon="mdi-arrow-left"
        class="text-none font-weight-bold text-muted mb-3"
        @click="clearSelection"
      >
        Back to Studies
      </v-btn>

      <!-- Study Hero Header -->
      <v-card
        class="ds-card mb-6 study-hero-header"
        variant="flat"
        style="overflow: hidden"
      >
        <div class="study-hero-bg">
          <div
            class="d-flex align-center justify-space-between flex-wrap pa-5"
            style="position: relative; z-index: 1"
          >
            <!-- Left: Study identity -->
            <div class="d-flex align-center flex-wrap" style="gap: 12px">
              <v-avatar
                :color="currentStudy.Completed ? 'success' : 'primary'"
                size="52"
                class="study-hero-avatar"
              >
                <v-icon size="28" color="white">mdi-flask-outline</v-icon>
              </v-avatar>
              <div>
                <h2
                  class="text-h5 font-weight-bold"
                  style="
                    font-family: var(--ds-font-family-heading);
                    color: var(--color-primary);
                    line-height: 1.3;
                  "
                >
                  {{ currentStudy.StudyName }}
                </h2>
                <div class="d-flex align-center mt-1" style="gap: 8px">
                  <v-chip
                    size="small"
                    variant="tonal"
                    color="primary"
                    class="font-weight-bold"
                    >{{ currentStudy.StudyType }}</v-chip
                  >
                  <v-chip
                    size="small"
                    :color="currentStudy.Completed ? 'success' : 'warning'"
                    variant="flat"
                    class="text-white font-weight-bold"
                  >
                    <v-icon start size="14">{{
                      currentStudy.Completed ? "mdi-check-circle" : "mdi-progress-clock"
                    }}</v-icon>
                    {{ currentStudy.Completed ? "Completed" : "In Progress" }}
                  </v-chip>
                </div>
              </div>
            </div>

            <!-- Right: Action buttons -->
            <div class="d-flex align-center flex-wrap" style="gap: 8px">
              <v-btn
                :color="currentStudy.Completed ? 'warning' : 'success'"
                variant="tonal"
                :prepend-icon="currentStudy.Completed ? 'mdi-restore' : 'mdi-check-all'"
                class="text-none font-weight-bold"
                @click.stop="changeStudyStatus(currentStudy)"
                :disabled="!canManageStudyStatus(currentStudy)"
              >
                {{ currentStudy.Completed ? "Mark In Progress" : "Mark Completed" }}
              </v-btn>

              <v-btn
                color="secondary"
                variant="tonal"
                prepend-icon="mdi-content-copy"
                class="text-none font-weight-bold"
                @click.stop="duplicateStudy"
                :disabled="!canDuplicateStudy"
              >
                Duplicate
              </v-btn>

              <v-btn
                color="error"
                variant="tonal"
                prepend-icon="mdi-delete"
                class="text-none font-weight-bold"
                @click.stop="deleteStudy"
                :disabled="!canEditStudy"
              >
                Delete
              </v-btn>
              <v-btn
                color="primary"
                variant="flat"
                prepend-icon="mdi-pencil"
                class="text-none font-weight-bold"
                @click.stop="editStudy"
                :disabled="!canEditStudy"
              >
                Edit Study
              </v-btn>
            </div>
          </div>
        </div>
      </v-card>

      <v-card
        class="ds-card d-flex flex-column"
        variant="flat"
        style="height: calc(100vh - 280px); overflow: hidden"
      >
        <v-tabs
          v-model="studyTab"
          color="primary"
          bg-color="grey-lighten-4"
          align-tabs="start"
          class="flex-shrink-0"
        >
          <v-tab value="overview"
            ><v-icon start>mdi-text-box-search-outline</v-icon>Overview</v-tab
          >
          <v-tab value="analytics"><v-icon start>mdi-chart-line</v-icon>Analytics</v-tab>
          <v-tab value="logistics"
            ><v-icon start>mdi-account-group-outline</v-icon>Team & Logistics</v-tab
          >
          <v-tab value="communications"
            ><v-icon start>mdi-email-fast-outline</v-icon>Communications</v-tab
          >
        </v-tabs>
        <v-divider></v-divider>

        <v-window v-model="studyTab" class="flex-grow-1" style="overflow-y: auto">
          <v-window-item value="overview" class="pa-6">
            <v-row>
              <v-col cols="12" md="8">
                <SectionHeader
                  title="Study Description"
                  icon="mdi-card-text-outline"
                  class="mt-0"
                />
                <div
                  class="text-body-1 bg-grey-lighten-4 pa-6 rounded"
                  style="
                    white-space: pre-wrap;
                    line-height: 1.6;
                    border: 1px solid #e2e8f0;
                  "
                >
                  {{ currentStudy.Description || "No description provided." }}
                </div>
              </v-col>

              <v-col cols="12" md="4" style="border-left: 1px solid #e2e8f0">
                <SectionHeader
                  title="Recruitment Criteria"
                  icon="mdi-filter-variant"
                  class="mt-0"
                />

                <div class="mb-6">
                  <div
                    class="text-body-2 font-weight-bold text-uppercase text-muted mb-2"
                  >
                    Age Groups
                  </div>
                  <div
                    v-if="currentStudy.AgeGroups && currentStudy.AgeGroups.length > 0"
                    class="d-flex flex-wrap gap-2"
                    style="gap: 8px"
                  >
                    <v-chip
                      v-for="(group, i) in currentStudy.AgeGroups"
                      :key="i"
                      color="primary"
                      variant="tonal"
                    >
                      <v-icon start size="16">mdi-human-child</v-icon>
                      {{ AgeFormated(group.MinAge) }} – {{ AgeFormated(group.MaxAge) }}
                    </v-chip>
                  </div>
                  <span v-else class="text-body-1 text-muted">—</span>
                </div>

                <div
                  v-if="
                    currentStudy.Prerequisites && currentStudy.Prerequisites.length > 0
                  "
                  class="mb-6"
                >
                  <div
                    class="text-body-2 font-weight-bold text-uppercase text-muted mb-2"
                  >
                    Prerequisites
                  </div>
                  <div class="d-flex flex-wrap gap-2" style="gap: 8px">
                    <v-chip
                      v-for="p in currentStudy.Prerequisites"
                      :key="p.id"
                      color="success"
                      variant="tonal"
                    >
                      <v-icon start size="16">mdi-check-circle-outline</v-icon
                      >{{ p.StudyName }}
                    </v-chip>
                  </div>
                </div>

                <div
                  v-if="currentStudy.Exclusions && currentStudy.Exclusions.length > 0"
                  class="mb-6"
                >
                  <div
                    class="text-body-2 font-weight-bold text-uppercase text-muted mb-2"
                  >
                    Exclusions
                  </div>
                  <div class="d-flex flex-wrap gap-2" style="gap: 8px">
                    <v-chip
                      v-for="e in currentStudy.Exclusions"
                      :key="e.id"
                      color="error"
                      variant="tonal"
                    >
                      <v-icon start size="16">mdi-close-circle-outline</v-icon
                      >{{ e.StudyName }}
                    </v-chip>
                  </div>
                </div>

                <div>
                  <div
                    class="text-body-2 font-weight-bold text-uppercase text-muted mb-2"
                  >
                    Participant Health Criteria
                  </div>
                  <div class="d-flex flex-wrap gap-2" style="gap: 8px">
                    <v-chip
                      variant="tonal"
                      :color="criteriaColor(currentStudy.ASDParticipant)"
                      >ASD: {{ currentStudy.ASDParticipant }}</v-chip
                    >
                    <v-chip
                      variant="tonal"
                      :color="criteriaColor(currentStudy.PrematureParticipant)"
                      >Premature: {{ currentStudy.PrematureParticipant }}</v-chip
                    >
                    <v-chip
                      variant="tonal"
                      :color="criteriaColor(currentStudy.IllParticipant)"
                      >Illness: {{ currentStudy.IllParticipant }}</v-chip
                    >
                    <v-chip
                      variant="tonal"
                      :color="criteriaColor(currentStudy.VisionLossParticipant)"
                      >Vision: {{ currentStudy.VisionLossParticipant }}</v-chip
                    >
                    <v-chip
                      variant="tonal"
                      :color="criteriaColor(currentStudy.HearingLossParticipant)"
                      >Hearing: {{ currentStudy.HearingLossParticipant }}</v-chip
                    >
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-window-item>

          <v-window-item value="analytics" class="pa-6 bg-grey-lighten-4">
            <div v-if="studyStatsLoaded">
              <v-row class="mb-4">
                <v-col cols="12" sm="4">
                  <v-card
                    class="ds-card pa-4 d-flex align-center"
                    variant="flat"
                    style="border-left: 4px solid var(--color-primary) !important"
                  >
                    <v-avatar color="primary" variant="tonal" size="56" class="mr-4">
                      <v-icon size="28">mdi-account-group</v-icon>
                    </v-avatar>
                    <div>
                      <div
                        class="text-caption font-weight-bold text-uppercase text-muted"
                      >
                        Total Recruited
                      </div>
                      <div
                        class="text-h4 font-weight-bold"
                        style="color: var(--color-primary)"
                      >
                        {{ kpiTotalRecruited }}
                      </div>
                    </div>
                  </v-card>
                </v-col>

                <v-col cols="12" sm="4">
                  <v-card
                    class="ds-card pa-4 d-flex align-center"
                    variant="flat"
                    style="border-left: 4px solid #10b981 !important"
                  >
                    <v-avatar color="success" variant="tonal" size="56" class="mr-4">
                      <v-icon size="28" color="success">mdi-check-circle-outline</v-icon>
                    </v-avatar>
                    <div>
                      <div
                        class="text-caption font-weight-bold text-uppercase text-muted"
                      >
                        Completed Runs
                      </div>
                      <div class="text-h4 font-weight-bold text-success">
                        {{ kpiTotalCompleted }}
                      </div>
                    </div>
                  </v-card>
                </v-col>

                <v-col cols="12" sm="4">
                  <v-card
                    class="ds-card pa-4 d-flex align-center"
                    variant="flat"
                    style="border-left: 4px solid #ef4444 !important"
                  >
                    <v-avatar color="error" variant="tonal" size="56" class="mr-4">
                      <v-icon size="28" color="error">mdi-calendar-remove</v-icon>
                    </v-avatar>
                    <div>
                      <div
                        class="text-caption font-weight-bold text-uppercase text-muted"
                      >
                        Drop-off Rate
                      </div>
                      <div class="text-h4 font-weight-bold text-error">
                        {{ kpiDropoffRate }}%
                      </div>
                    </div>
                  </v-card>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" md="4">
                  <v-card class="ds-card pa-4 h-100 text-center" variant="flat">
                    <h3 class="text-subtitle-1 font-weight-bold text-primary mb-2">
                      Overall Progress
                    </h3>
                    <studyProgressChart :stats="studyStats.totalNperStatus" />
                  </v-card>
                </v-col>
                <v-col cols="12" md="8">
                  <v-card
                    class="ds-card pa-4 h-100"
                    variant="flat"
                    style="overflow-x: auto"
                  >
                    <h3 class="text-subtitle-1 font-weight-bold text-primary mb-2">
                      Weekly Recruitment History
                    </h3>
                    <studyHistoryChart :stats="studyStats.totalNWeeklyRecrtuiment" />
                  </v-card>
                </v-col>
                <v-col cols="12" md="4">
                  <v-card
                    class="ds-card pa-4 h-100"
                    variant="flat"
                    style="overflow-x: auto"
                  >
                    <h3 class="text-subtitle-1 font-weight-bold text-primary mb-2">
                      Experimenter Workload
                    </h3>
                    <experimenterStatsChart
                      :stats="[
                        ...(studyStats.totalNperPersonnelPriExp || []),
                        ...(studyStats.totalNperPersonnelAssistExp || []),
                      ]"
                    />
                  </v-card>
                </v-col>
                <v-col cols="12" md="8">
                  <v-card
                    class="ds-card pa-4 h-100"
                    variant="flat"
                    style="overflow-x: auto"
                  >
                    <h3 class="text-subtitle-1 font-weight-bold text-primary mb-2">
                      Recruitment by Researcher
                    </h3>
                    <recruitmentProgressChart
                      :stats="studyStats.totalNperPersonnelStatus"
                    />
                  </v-card>
                </v-col>
              </v-row>
            </div>
            <div v-else class="text-center py-12">
              <v-progress-circular
                indeterminate
                color="primary"
                size="64"
              ></v-progress-circular>
              <p class="text-muted mt-4 font-weight-bold">Loading deep analytics...</p>
            </div>
          </v-window-item>

          <v-window-item value="logistics" class="pa-6">
            <v-row>
              <v-col cols="12" md="4">
                <SectionHeader
                  title="Point of Contact"
                  icon="mdi-account-star"
                  class="mt-0"
                />
                <v-card
                  variant="outlined"
                  class="pa-4 mb-6 bg-grey-lighten-4"
                  style="border-color: #e2e8f0 !important"
                >
                  <div class="d-flex align-center mb-3">
                    <v-avatar
                      color="primary"
                      size="48"
                      class="mr-3 text-white font-weight-bold"
                    >
                      {{
                        currentStudy.PointofContact?.Name
                          ? currentStudy.PointofContact.Name.charAt(0)
                          : "?"
                      }}
                    </v-avatar>
                    <div>
                      <div class="text-subtitle-1 font-weight-bold text-primary">
                        {{ currentStudy.PointofContact?.Name || "Unassigned" }}
                      </div>
                      <div
                        class="text-caption text-muted font-weight-bold text-uppercase"
                      >
                        Primary Contact
                      </div>
                    </div>
                  </div>
                  <v-divider class="my-2"></v-divider>
                  <v-list density="compact" class="pa-0 bg-transparent">
                    <v-list-item
                      prepend-icon="mdi-email-outline"
                      :title="currentStudy.PointofContact?.Email || 'No email'"
                      class="px-0"
                    ></v-list-item>
                    <v-list-item
                      prepend-icon="mdi-phone-outline"
                      :title="
                        PhoneFormated(currentStudy.PointofContact?.Phone) || 'No phone'
                      "
                      class="px-0"
                    ></v-list-item>
                  </v-list>
                </v-card>

                <SectionHeader title="Testing Room" icon="mdi-door-open" class="mt-0" />
                <v-card
                  variant="outlined"
                  class="pa-4"
                  :class="{
                    'bg-error-lighten-5': !currentStudy.FK_TestingRoom,
                    'bg-grey-lighten-4': currentStudy.FK_TestingRoom,
                  }"
                  style="border-color: #e2e8f0 !important"
                >
                  <div
                    class="text-caption font-weight-bold text-uppercase text-muted mb-2"
                  >
                    Assigned Physical Space
                  </div>
                  <v-select
                    variant="outlined"
                    density="compact"
                    :items="currentTestingRooms"
                    v-model="selectedRoomId"
                    item-value="id"
                    :item-title="(item) => `${item.name} (${item.location})`"
                    @update:model-value="optionChangedTestingRoom"
                    hide-details
                    placeholder="Select a testing room..."
                    :bg-color="!currentStudy.FK_TestingRoom ? 'white' : ''"
                  ></v-select>
                  <div
                    v-if="!currentStudy.FK_TestingRoom"
                    class="text-caption text-error font-weight-bold mt-2"
                  >
                    <v-icon size="small" color="error" class="mr-1"
                      >mdi-alert-circle</v-icon
                    >Required for calendar sync!
                  </div>
                </v-card>
              </v-col>

              <v-col cols="12" md="8">
                <SectionHeader
                  title="Assigned Experimenters"
                  icon="mdi-account-multiple"
                  class="mt-0"
                />
                <v-card
                  variant="outlined"
                  class="pa-4"
                  style="border-color: #e2e8f0 !important"
                >
                  <AssignedExperimenters
                    v-if="currentStudy.id"
                    :Experimenters="currentStudy.Experimenters"
                    :labMembers="labMembers"
                    :studyId="currentStudy.id"
                    :PointofContactId="currentStudy.PointofContact?.id"
                    @updatedExperimenters="updateExperimenters"
                  />
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>

          <v-window-item value="communications" class="pa-6">
            <!-- Header with Save button -->
            <div class="d-flex justify-space-between align-center mb-4">
              <SectionHeader
                title="Email Templates & Scripts"
                icon="mdi-email-edit-outline"
                class="mt-0 mb-0"
              />
              <v-btn
                size="small"
                color="primary"
                variant="flat"
                prepend-icon="mdi-content-save"
                @click="saveEmailTemplates"
                :loading="savingTemplates"
                class="text-none font-weight-bold"
              >
                Save All Changes
              </v-btn>
            </div>

            <!-- Sub-tabs for each template type -->
            <v-card
              variant="outlined"
              style="border-color: #e2e8f0 !important; overflow: hidden"
            >
              <v-tabs
                v-model="commTab"
                color="primary"
                density="compact"
                class="comm-subtabs"
                style="border-bottom: 1px solid #e2e8f0"
              >
                <v-tab value="phone" class="text-none" style="font-size: 0.95rem">
                  <v-icon start size="18">mdi-phone-outline</v-icon>Phone Script
                </v-tab>
                <v-tab value="confirm" class="text-none" style="font-size: 0.95rem">
                  <v-icon start size="18">mdi-email-check-outline</v-icon>Confirmation
                </v-tab>
                <v-tab value="remind" class="text-none" style="font-size: 0.95rem">
                  <v-icon start size="18">mdi-bell-outline</v-icon>Reminder
                </v-tab>
                <v-tab value="follow" class="text-none" style="font-size: 0.95rem">
                  <v-icon start size="18">mdi-email-fast-outline</v-icon>Follow-up
                </v-tab>
              </v-tabs>

              <v-window v-model="commTab">
                <!-- Phone Script (no preview needed) -->
                <v-window-item value="phone">
                  <div class="pa-5">
                    <div
                      class="text-body-2 font-weight-bold text-uppercase text-muted mb-3"
                    >
                      <v-icon size="18" class="mr-1">mdi-script-text-outline</v-icon>
                      Script used when calling families for recruitment
                    </div>
                    <v-textarea
                      v-model="currentStudy.PhoneScript"
                      variant="outlined"
                      rows="20"
                      hide-details
                      density="compact"
                      placeholder="Enter phone recruitment script..."
                      style="font-size: 0.95rem"
                    ></v-textarea>
                  </div>
                </v-window-item>

                <!-- Confirmation Email -->
                <v-window-item value="confirm">
                  <v-row no-gutters>
                    <v-col
                      cols="12"
                      md="6"
                      class="pa-5"
                      style="border-right: 1px solid #e2e8f0"
                    >
                      <div class="d-flex align-center mb-3">
                        <v-icon size="18" color="primary" class="mr-2">mdi-pencil</v-icon>
                        <span
                          class="text-body-2 font-weight-bold text-uppercase text-muted"
                          >Edit Snippet</span
                        >
                      </div>
                      <div class="text-body-2 text-muted mb-3">
                        Sent when an appointment is booked.
                      </div>
                      <v-alert
                        variant="tonal"
                        color="secondary"
                        density="compact"
                        class="mb-3"
                        style="font-size: 0.8rem"
                      >
                        <div class="font-weight-bold mb-1">Available Keywords</div>
                        <div v-pre class="d-flex flex-wrap" style="gap: 4px 12px">
                          <span
                            ><code>${{childName}}</code> — Child's first name</span
                          >
                          <span
                            ><code>${{he/she}}</code> — Pronoun (subject)</span
                          >
                          <span
                            ><code>${{him/her}}</code> — Pronoun (object)</span
                          >
                          <span
                            ><code>${{his/her}}</code> — Pronoun (possessive)</span
                          >
                          <span
                            ><code>${{ZoomLink}}</code> — Experimenter's Zoom link</span
                          >
                        </div>
                      </v-alert>
                      <RichTextEditor v-model="currentStudy.EmailTemplate" />
                    </v-col>
                    <v-col cols="12" md="6" class="pa-5 bg-grey-lighten-4">
                      <div class="d-flex align-center mb-3">
                        <v-icon size="18" color="success" class="mr-2"
                          >mdi-eye-outline</v-icon
                        >
                        <span
                          class="text-body-2 font-weight-bold text-uppercase text-muted"
                          >Live Preview</span
                        >
                      </div>
                      <div
                        class="template-preview pa-4 rounded bg-white"
                        v-html="confirmationPreview"
                        style="
                          max-height: 400px;
                          overflow-y: auto;
                          border: 1px solid #e2e8f0;
                          font-size: 1rem;
                          line-height: 1.6;
                        "
                      ></div>
                    </v-col>
                  </v-row>
                </v-window-item>

                <!-- Reminder Email -->
                <v-window-item value="remind">
                  <v-row no-gutters>
                    <v-col
                      cols="12"
                      md="6"
                      class="pa-5"
                      style="border-right: 1px solid #e2e8f0"
                    >
                      <div class="d-flex align-center mb-3">
                        <v-icon size="18" color="primary" class="mr-2">mdi-pencil</v-icon>
                        <span
                          class="text-body-2 font-weight-bold text-uppercase text-muted"
                          >Edit Snippet</span
                        >
                      </div>
                      <div class="text-body-2 text-muted mb-3">
                        Sent automatically the day before the study.
                      </div>
                      <v-alert
                        variant="tonal"
                        color="secondary"
                        density="compact"
                        class="mb-3"
                        style="font-size: 0.8rem"
                      >
                        <div class="font-weight-bold mb-1">Available Keywords</div>
                        <div v-pre class="d-flex flex-wrap" style="gap: 4px 12px">
                          <span
                            ><code>${{childName}}</code> — Child's first name</span
                          >
                          <span
                            ><code>${{he/she}}</code> — Pronoun (subject)</span
                          >
                          <span
                            ><code>${{him/her}}</code> — Pronoun (object)</span
                          >
                          <span
                            ><code>${{his/her}}</code> — Pronoun (possessive)</span
                          >
                          <span
                            ><code>${{ZoomLink}}</code> — Experimenter's Zoom link</span
                          >
                        </div>
                      </v-alert>
                      <RichTextEditor v-model="currentStudy.ReminderTemplate" />
                    </v-col>
                    <v-col cols="12" md="6" class="pa-5 bg-grey-lighten-4">
                      <div class="d-flex align-center mb-3">
                        <v-icon size="18" color="success" class="mr-2"
                          >mdi-eye-outline</v-icon
                        >
                        <span
                          class="text-body-2 font-weight-bold text-uppercase text-muted"
                          >Live Preview</span
                        >
                      </div>
                      <div
                        class="template-preview pa-4 rounded bg-white"
                        v-html="reminderPreview"
                        style="
                          max-height: 400px;
                          overflow-y: auto;
                          border: 1px solid #e2e8f0;
                          font-size: 1rem;
                          line-height: 1.6;
                        "
                      ></div>
                    </v-col>
                  </v-row>
                </v-window-item>

                <!-- Follow-up Email -->
                <v-window-item value="follow">
                  <v-row no-gutters>
                    <v-col
                      cols="12"
                      md="6"
                      class="pa-5"
                      style="border-right: 1px solid #e2e8f0"
                    >
                      <div class="d-flex align-center mb-3">
                        <v-icon size="18" color="primary" class="mr-2">mdi-pencil</v-icon>
                        <span
                          class="text-body-2 font-weight-bold text-uppercase text-muted"
                          >Edit Snippet</span
                        >
                      </div>
                      <div class="text-body-2 text-muted mb-3">
                        Appended to the generic "Thank You" email sent after study
                        completion.
                      </div>
                      <v-alert
                        variant="tonal"
                        color="secondary"
                        density="compact"
                        class="mb-3"
                        style="font-size: 0.8rem"
                      >
                        <div class="font-weight-bold mb-1">Available Keywords</div>
                        <div v-pre class="d-flex flex-wrap" style="gap: 4px 12px">
                          <span
                            ><code>${{childName}}</code> — Child's first name</span
                          >
                          <span
                            ><code>${{he/she}}</code> — Pronoun (subject)</span
                          >
                          <span
                            ><code>${{him/her}}</code> — Pronoun (object)</span
                          >
                          <span
                            ><code>${{his/her}}</code> — Pronoun (possessive)</span
                          >
                          <span
                            ><code>${{ZoomLink}}</code> — Experimenter's Zoom link</span
                          >
                        </div>
                      </v-alert>
                      <RichTextEditor v-model="currentStudy.FollowUPEmailSnippet" />
                    </v-col>
                    <v-col cols="12" md="6" class="pa-5 bg-grey-lighten-4">
                      <div class="d-flex align-center mb-3">
                        <v-icon size="18" color="success" class="mr-2"
                          >mdi-eye-outline</v-icon
                        >
                        <span
                          class="text-body-2 font-weight-bold text-uppercase text-muted"
                          >Live Preview</span
                        >
                      </div>
                      <div
                        class="template-preview pa-4 rounded bg-white"
                        v-html="followupPreview"
                        style="
                          max-height: 400px;
                          overflow-y: auto;
                          border: 1px solid #e2e8f0;
                          font-size: 1rem;
                          line-height: 1.6;
                        "
                      ></div>
                    </v-col>
                  </v-row>
                </v-window-item>
              </v-window>
            </v-card>
          </v-window-item>
        </v-window>
      </v-card>
    </div>

    <v-dialog v-model="dialog" fullscreen transition="dialog-bottom-transition">
      <v-card class="bg-grey-lighten-4" variant="flat">
        <v-toolbar color="white" class="px-2" style="border-bottom: 1px solid #e2e8f0">
          <v-btn icon color="muted" @click="close" variant="text"
            ><v-icon>mdi-close</v-icon></v-btn
          >
          <v-icon color="primary" class="mr-3 ml-2">mdi-flask-edit-outline</v-icon>
          <v-toolbar-title
            class="font-weight-bold"
            style="
              font-family: var(--ds-font-family-heading);
              color: var(--color-primary);
            "
          >
            {{ editedIndex === -1 ? "Create New Study" : "Edit Study Information" }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="flat"
            @click="save"
            prepend-icon="mdi-content-save-check"
            class="font-weight-bold text-none mr-2"
          >
            Save & Exit
          </v-btn>
        </v-toolbar>

        <v-stepper
          v-model="studyStepper"
          class="elevation-0 h-100 d-flex flex-column bg-transparent"
          hide-actions
        >
          <v-stepper-header
            class="bg-white elevation-0"
            style="border-bottom: 1px solid #e2e8f0"
          >
            <v-stepper-item
              title="Core Identity"
              :value="1"
              :complete="studyStepper > 1"
              editable
            ></v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item
              title="Eligibility Rules"
              :value="2"
              :complete="studyStepper > 2"
              editable
            ></v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item
              title="Team Logistics"
              :value="3"
              :complete="studyStepper > 3"
              editable
            ></v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item title="Communications" :value="4" editable></v-stepper-item>
          </v-stepper-header>

          <v-stepper-window
            class="flex-grow-1"
            style="overflow-y: auto; padding-bottom: 80px"
          >
            <v-form ref="form" v-model="valid" lazy-validation>
              <v-stepper-window-item :value="1">
                <v-container style="max-width: 800px" class="mt-4">
                  <h2
                    class="text-h5 font-weight-bold text-primary mb-6"
                    style="font-family: var(--ds-font-family-heading)"
                  >
                    Core Identity
                  </h2>
                  <v-row dense>
                    <v-col cols="12" sm="8">
                      <div
                        class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1"
                      >
                        Study Name *
                      </div>
                      <v-text-field
                        v-model="editedStudy.StudyName"
                        variant="outlined"
                        density="compact"
                        :rules="[(v) => !!v || 'Required']"
                        bg-color="white"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="4">
                      <div
                        class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1"
                      >
                        Study Type *
                      </div>
                      <v-select
                        v-model="editedStudy.StudyType"
                        :items="[
                          'Behavioural',
                          'EEG/ERP',
                          'EyeTracking',
                          'fNIRS',
                          'Online',
                        ]"
                        variant="outlined"
                        density="compact"
                        bg-color="white"
                      ></v-select>
                    </v-col>
                    <v-col cols="12">
                      <div
                        class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1"
                      >
                        Study Summary / Description
                      </div>
                      <v-textarea
                        v-model="editedStudy.Description"
                        variant="outlined"
                        rows="6"
                        bg-color="white"
                        placeholder="Provide a brief summary for researchers..."
                      ></v-textarea>
                    </v-col>
                  </v-row>
                  <div class="d-flex justify-end mt-6">
                    <v-btn
                      color="primary"
                      variant="flat"
                      @click="studyStepper = 2"
                      append-icon="mdi-arrow-right"
                      >Next Step</v-btn
                    >
                  </div>
                </v-container>
              </v-stepper-window-item>

              <v-stepper-window-item :value="2">
                <v-container style="max-width: 800px" class="mt-4">
                  <h2
                    class="text-h5 font-weight-bold text-primary mb-6"
                    style="font-family: var(--ds-font-family-heading)"
                  >
                    Eligibility Rules
                  </h2>

                  <v-card class="ds-card pa-6 mb-6" variant="flat">
                    <h3 class="text-h6 mb-4">Age Groups</h3>
                    <v-row
                      v-for="(group, index) in editedStudy.AgeGroups"
                      :key="index"
                      dense
                      align="center"
                    >
                      <v-col cols="5">
                        <v-text-field
                          v-model.number="group.MinAge"
                          label="Min Age (months)"
                          type="number"
                          variant="outlined"
                          density="compact"
                          :rules="[
                            (v) => (v !== null && v !== '') || 'Required',
                            (v) => v >= 0 || 'Must be ≥ 0',
                            (v) =>
                              group.MaxAge === null ||
                              group.MaxAge === '' ||
                              v < group.MaxAge ||
                              'Must be less than Max Age',
                          ]"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="5">
                        <v-text-field
                          v-model.number="group.MaxAge"
                          label="Max Age (months)"
                          type="number"
                          variant="outlined"
                          density="compact"
                          :rules="[
                            (v) => (v !== null && v !== '') || 'Required',
                            (v) => v >= 0 || 'Must be ≥ 0',
                            (v) =>
                              group.MinAge === null ||
                              group.MinAge === '' ||
                              v > group.MinAge ||
                              'Must be greater than Min Age',
                          ]"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="2" class="text-center">
                        <v-btn
                          icon="mdi-delete-outline"
                          color="error"
                          variant="text"
                          @click="editedStudy.AgeGroups.splice(index, 1)"
                        ></v-btn>
                      </v-col>
                    </v-row>
                    <v-btn
                      variant="tonal"
                      color="primary"
                      prepend-icon="mdi-plus"
                      @click="editedStudy.AgeGroups.push({ MinAge: null, MaxAge: null })"
                    >
                      Add Age Group
                    </v-btn>
                  </v-card>

                  <v-card class="ds-card pa-6 mb-6" variant="flat">
                    <h3 class="text-h6 mb-4">Study Requirements</h3>
                    <v-row dense>
                      <v-col cols="12" md="6">
                        <div
                          class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1"
                        >
                          Prerequisite Studies
                        </div>
                        <v-select
                          v-model="editedStudy.PrerequisiteIds"
                          :items="Studies.filter((s) => s.id !== editedStudy.id)"
                          item-title="StudyName"
                          item-value="id"
                          placeholder="Must have completed..."
                          multiple
                          chips
                          variant="outlined"
                          density="compact"
                        ></v-select>
                      </v-col>
                      <v-col cols="12" md="6">
                        <div
                          class="text-caption font-weight-bold text-uppercase text-muted mb-1 px-1"
                        >
                          Excluded Studies
                        </div>
                        <v-select
                          v-model="editedStudy.ExclusionIds"
                          :items="Studies.filter((s) => s.id !== editedStudy.id)"
                          item-title="StudyName"
                          item-value="id"
                          placeholder="Must NOT have participated..."
                          multiple
                          chips
                          variant="outlined"
                          density="compact"
                        ></v-select>
                      </v-col>
                    </v-row>
                  </v-card>

                  <v-card class="ds-card pa-6" variant="flat">
                    <h3 class="text-h6 mb-4">Participant Health Criteria</h3>
                    <v-row dense>
                      <v-col cols="12" sm="4"
                        ><v-select
                          v-model="editedStudy.ASDParticipant"
                          :items="inclusionOptions"
                          label="ASD"
                          variant="outlined"
                          density="compact"
                        ></v-select
                      ></v-col>
                      <v-col cols="12" sm="4"
                        ><v-select
                          v-model="editedStudy.PrematureParticipant"
                          :items="inclusionOptions"
                          label="Premature"
                          variant="outlined"
                          density="compact"
                        ></v-select
                      ></v-col>
                      <v-col cols="12" sm="4"
                        ><v-select
                          v-model="editedStudy.IllParticipant"
                          :items="inclusionOptions"
                          label="Illness"
                          variant="outlined"
                          density="compact"
                        ></v-select
                      ></v-col>
                      <v-col cols="12" sm="6"
                        ><v-select
                          v-model="editedStudy.VisionLossParticipant"
                          :items="inclusionOptions"
                          label="Vision Deficit"
                          variant="outlined"
                          density="compact"
                        ></v-select
                      ></v-col>
                      <v-col cols="12" sm="6"
                        ><v-select
                          v-model="editedStudy.HearingLossParticipant"
                          :items="inclusionOptions"
                          label="Hearing Deficit"
                          variant="outlined"
                          density="compact"
                        ></v-select
                      ></v-col>
                    </v-row>
                  </v-card>

                  <div class="d-flex justify-space-between mt-6">
                    <v-btn
                      variant="text"
                      @click="studyStepper = 1"
                      prepend-icon="mdi-arrow-left"
                      class="text-muted"
                      >Back</v-btn
                    >
                    <v-btn
                      color="primary"
                      variant="flat"
                      @click="studyStepper = 3"
                      append-icon="mdi-arrow-right"
                      >Next Step</v-btn
                    >
                  </div>
                </v-container>
              </v-stepper-window-item>

              <v-stepper-window-item :value="3">
                <v-container style="max-width: 800px" class="mt-4">
                  <h2
                    class="text-h5 font-weight-bold text-primary mb-6"
                    style="font-family: var(--ds-font-family-heading)"
                  >
                    Logistics & Team
                  </h2>

                  <v-card class="ds-card pa-6 mb-6" variant="flat">
                    <div class="d-flex align-start mb-4">
                      <v-icon color="primary" size="32" class="mr-3 mt-1"
                        >mdi-account-star-outline</v-icon
                      >
                      <div>
                        <h3 class="text-h6">Point of Contact *</h3>
                        <p class="text-body-2 text-muted">
                          Who is the primary person responsible for this study?
                        </p>
                      </div>
                    </div>
                    <v-select
                      v-model="PointofContact"
                      :items="labMembers"
                      item-title="Name"
                      item-value="id"
                      return-object
                      variant="outlined"
                      density="comfortable"
                      :rules="[(v) => !!v || 'Required']"
                    ></v-select>
                  </v-card>

                  <div class="d-flex justify-space-between mt-6">
                    <v-btn
                      variant="text"
                      @click="studyStepper = 2"
                      prepend-icon="mdi-arrow-left"
                      class="text-muted"
                      >Back</v-btn
                    >
                    <v-btn
                      color="primary"
                      variant="flat"
                      @click="studyStepper = 4"
                      append-icon="mdi-arrow-right"
                      >Next Step</v-btn
                    >
                  </div>
                </v-container>
              </v-stepper-window-item>

              <v-stepper-window-item :value="4">
                <v-container style="max-width: 900px" class="mt-4">
                  <h2
                    class="text-h5 font-weight-bold text-primary mb-6"
                    style="font-family: var(--ds-font-family-heading)"
                  >
                    Scripts & Email Templates
                  </h2>

                  <v-card class="ds-card" variant="flat" style="overflow: hidden">
                    <v-tabs
                      v-model="emailTemplateTab"
                      color="primary"
                      bg-color="grey-lighten-4"
                    >
                      <v-tab value="phone"
                        ><v-icon start>mdi-phone-outline</v-icon>Phone Script</v-tab
                      >
                      <v-tab value="confirm"
                        ><v-icon start>mdi-email-check-outline</v-icon>Confirmation</v-tab
                      >
                      <v-tab value="remind"
                        ><v-icon start>mdi-calendar-alert</v-icon>Reminder</v-tab
                      >
                      <v-tab value="follow"
                        ><v-icon start>mdi-email-fast-outline</v-icon>Follow-up</v-tab
                      >
                    </v-tabs>

                    <v-divider></v-divider>

                    <v-window v-model="emailTemplateTab" class="pa-6">
                      <v-window-item value="phone">
                        <h3 class="text-h6 mb-2">Phone Recruitment Script</h3>
                        <p class="text-caption text-muted mb-4">
                          This script is shown to researchers when they call families to
                          recruit for this study.
                        </p>
                        <v-textarea
                          v-model="editedStudy.PhoneScript"
                          variant="outlined"
                          rows="8"
                          placeholder="Hi, I'm calling from the lab..."
                        ></v-textarea>
                      </v-window-item>

                      <v-window-item value="confirm">
                        <h3 class="text-h6 mb-2">Confirmation Email Snippet</h3>
                        <p class="text-caption text-muted mb-2">
                          Sent when an appointment is booked.
                        </p>
                        <v-alert
                          variant="tonal"
                          color="secondary"
                          density="compact"
                          class="mb-4"
                          style="font-size: 0.75rem"
                        >
                          <div class="font-weight-bold mb-1">Available Keywords</div>
                          <div v-pre class="d-flex flex-wrap" style="gap: 4px 12px">
                            <span
                              ><code>${{childName}}</code> — Child's first name</span
                            >
                            <span
                              ><code>${{he/she}}</code> — Pronoun (subject)</span
                            >
                            <span
                              ><code>${{him/her}}</code> — Pronoun (object)</span
                            >
                            <span
                              ><code>${{his/her}}</code> — Pronoun (possessive)</span
                            >
                            <span
                              ><code>${{ZoomLink}}</code> — Experimenter's Zoom
                              link</span
                            >
                          </div>
                        </v-alert>
                        <RichTextEditor v-model="editedStudy.EmailTemplate" />
                      </v-window-item>

                      <v-window-item value="remind">
                        <h3 class="text-h6 mb-2">Reminder Email Snippet</h3>
                        <p class="text-caption text-muted mb-2">
                          Sent automatically the day before the study.
                        </p>
                        <v-alert
                          variant="tonal"
                          color="secondary"
                          density="compact"
                          class="mb-4"
                          style="font-size: 0.75rem"
                        >
                          <div class="font-weight-bold mb-1">Available Keywords</div>
                          <div v-pre class="d-flex flex-wrap" style="gap: 4px 12px">
                            <span
                              ><code>${{childName}}</code> — Child's first name</span
                            >
                            <span
                              ><code>${{he/she}}</code> — Pronoun (subject)</span
                            >
                            <span
                              ><code>${{him/her}}</code> — Pronoun (object)</span
                            >
                            <span
                              ><code>${{his/her}}</code> — Pronoun (possessive)</span
                            >
                            <span
                              ><code>${{ZoomLink}}</code> — Experimenter's Zoom
                              link</span
                            >
                          </div>
                        </v-alert>
                        <RichTextEditor v-model="editedStudy.ReminderTemplate" />
                      </v-window-item>

                      <v-window-item value="follow">
                        <h3 class="text-h6 mb-2">Follow-up Email Snippet (Thank You)</h3>
                        <p class="text-caption text-muted mb-2">
                          Appended to the generic "Thank You" email sent after completion.
                        </p>
                        <v-alert
                          variant="tonal"
                          color="secondary"
                          density="compact"
                          class="mb-4"
                          style="font-size: 0.75rem"
                        >
                          <div class="font-weight-bold mb-1">Available Keywords</div>
                          <div v-pre class="d-flex flex-wrap" style="gap: 4px 12px">
                            <span
                              ><code>${{childName}}</code> — Child's first name</span
                            >
                            <span
                              ><code>${{he/she}}</code> — Pronoun (subject)</span
                            >
                            <span
                              ><code>${{him/her}}</code> — Pronoun (object)</span
                            >
                            <span
                              ><code>${{his/her}}</code> — Pronoun (possessive)</span
                            >
                            <span
                              ><code>${{ZoomLink}}</code> — Experimenter's Zoom
                              link</span
                            >
                          </div>
                        </v-alert>
                        <RichTextEditor v-model="editedStudy.FollowUPEmailSnippet" />
                      </v-window-item>
                    </v-window>
                  </v-card>

                  <div class="d-flex justify-space-between mt-8">
                    <v-btn
                      variant="text"
                      @click="studyStepper = 3"
                      prepend-icon="mdi-arrow-left"
                      class="text-muted"
                      >Back</v-btn
                    >
                    <v-btn
                      color="success"
                      size="large"
                      variant="flat"
                      @click="save"
                      prepend-icon="mdi-content-save-check"
                      >Save & Complete Study</v-btn
                    >
                  </div>
                </v-container>
              </v-stepper-window-item>
            </v-form>
          </v-stepper-window>
        </v-stepper>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import moment from "moment";
import RichTextEditor from "@/components/RichTextEditor.vue";

import AssignedExperimenters from "@/components/AssignedExperimenters.vue";
import AlertBanner from "@/components/AlertBanner.vue";
import InfoField from "@/components/InfoField.vue";
import SectionHeader from "@/components/SectionHeader.vue";
import studyProgressChart from "@/components/studyProgressChart.vue";
import recruitmentProgressChart from "@/components/recruitmentProgressChart.vue";
import experimenterStatsChart from "@/components/experimenterStatsChart.vue";
import studyHistoryChart from "@/components/studyHistoryChart.vue";

import studyApi from "@/services/study";
import personnelApi from "@/services/personnel";
import testingRoomApi from "@/services/testingRoom";
import ConfirmDlg from "@/components/ConfirmDialog.vue";
import { useMainStore } from "@/stores/mainStore";

export default {
  name: "Study",
  components: {
    AssignedExperimenters,
    AlertBanner,
    InfoField,
    SectionHeader,
    RichTextEditor,
    studyProgressChart,
    recruitmentProgressChart,
    experimenterStatsChart,
    studyHistoryChart,
    ConfirmDlg,
  },
  setup() {
    const store = useMainStore();
    return { store };
  },

  data() {
    return {
      search: "",
      inProgressStudyFilter: true,
      headersStudy: [
        {
          title: "Study Name",
          align: "start",
          key: "StudyName",
          sortable: true,
          width: "70%",
        },
        {
          title: "Completed?",
          align: "center",
          key: "Completed",
          sortable: false,
          width: "30%",
        },
      ],
      Studies: [],
      selectedStudies: [],
      currentStudy: {
        StudyName: null,
        Completed: false,
        PointofContact: {},
      },
      editedStudy: {},
      PointofContact: null,
      dialog: false,
      dialogShowEmailPreviews: false,
      dialogStudyProgress: false,
      valid: true,
      editedIndex: -1,
      labMembers: [],
      currentTestingRooms: [],
      selectedRoomId: null,
      studyTab: "overview",
      commTab: "confirm",
      studyStepper: 1,
      emailTemplateTab: "phone",
      studyStatsLoaded: false,
      savingTemplates: false,
      tab: "one",
      groupBy: "year",
      groupByOptions: [
        { label: "None", value: "none" },
        { label: "Year Created", value: "year" },
        { label: "Point of Contact", value: "contact" },
        { label: "Study Type", value: "type" },
      ],
      studyStats: {
        totalNperStatus: [],
        totalNWeeklyRecrtuiment: [],
        totalNperPersonnelStatus: [],
        totalNperPersonnelPriExp: [],
        totalNperPersonnelAssistExp: [],
        totalCompletedRuns: 0,
      },
      inclusionOptions: ["Include", "Exclude", "Only"],
    };
  },

  computed: {
    filteredStudies() {
      let result = this.Studies;
      if (this.inProgressStudyFilter) {
        result = result.filter((s) => !s.Completed);
      }
      if (this.search) {
        const lowerSearch = this.search.toLowerCase();
        result = result.filter(
          (s) => s.StudyName && s.StudyName.toLowerCase().includes(lowerSearch)
        );
      }
      return result;
    },

    groupedStudies() {
      const studies = this.filteredStudies;
      if (this.groupBy === "none" || !this.groupBy) return null;

      const groups = {};

      studies.forEach((study) => {
        let key;
        if (this.groupBy === "year") {
          key = study.createdAt
            ? new Date(study.createdAt).getFullYear().toString()
            : "Unknown";
        } else if (this.groupBy === "contact") {
          key = study.PointofContact?.Name || "No Contact Set";
        } else if (this.groupBy === "type") {
          key = study.StudyType || "Unknown";
        }
        if (!groups[key]) groups[key] = [];
        groups[key].push(study);
      });

      // Sort group keys and return as an array to guarantee order
      const sortedKeys = Object.keys(groups).sort((a, b) => {
        if (this.groupBy === "year") return b.localeCompare(a); // descending
        return a.localeCompare(b); // alphabetical
      });
      return sortedKeys.map((k) => ({ label: k, studies: groups[k] }));
    },

    groupByIcon() {
      const icons = {
        year: "mdi-calendar",
        contact: "mdi-account-star",
        type: "mdi-flask-outline",
      };
      return icons[this.groupBy] || "mdi-format-list-group";
    },

    canCreateStudy() {
      const role = this.store.role;
      return ["Admin", "PI", "PostDoc", "GradStudent", "Lab manager"].includes(role);
    },

    canEditStudy() {
      if (!this.currentStudy.id || !this.currentStudy.PointofContact) return false;
      const role = this.store.role;
      return (
        this.currentStudy.PointofContact.id == this.store.userID ||
        ["Admin", "PI", "Lab manager", "PostDoc", "GradStudent"].includes(role)
      );
    },

    canViewProgress() {
      const role = this.store.role;
      return ["Admin", "PI", "PostDoc", "GradStudent", "Lab manager"].includes(role);
    },

    canDuplicateStudy() {
      if (!this.currentStudy || !this.currentStudy.id) return false;
      const role = this.store.role;
      return ["Admin", "PI", "Lab manager", "GradStudent", "PostDoc"].includes(role);
    },

    kpiTotalRecruited() {
      if (!this.studyStatsLoaded || !this.studyStats.totalNperStatus) return 0;
      return this.studyStats.totalNperStatus.reduce(
        (sum, item) => sum + item.NumberOfParticipants,
        0
      );
    },

    kpiTotalCompleted() {
      if (!this.studyStatsLoaded) return 0;
      if (Number.isFinite(this.studyStats.totalCompletedRuns)) {
        return this.studyStats.totalCompletedRuns;
      }
      // Backward-compatibility fallback for older API responses.
      if (!this.studyStats.totalNperStatus) return 0;
      const confirmedStats = this.studyStats.totalNperStatus.find(
        (s) => s.Status === "Confirmed"
      );
      return confirmedStats ? confirmedStats.NumberOfParticipants : 0;
    },

    kpiDropoffRate() {
      if (
        !this.studyStatsLoaded ||
        !this.studyStats.totalNperStatus ||
        this.kpiTotalRecruited === 0
      )
        return 0;
      const dropoffs = this.studyStats.totalNperStatus
        .filter((s) => ["No Show", "Cancelled", "Rejected"].includes(s.Status))
        .reduce((sum, item) => sum + item.NumberOfParticipants, 0);
      return Math.round((dropoffs / this.kpiTotalRecruited) * 100);
    },

    // Highlight replaced keywords with bold + color so they stand out
    confirmationPreview() {
      if (!this.currentStudy.EmailTemplate) return "<p>Email template not set.</p>";
      return this.highlightKeywords(this.currentStudy.EmailTemplate);
    },
    reminderPreview() {
      if (!this.currentStudy.ReminderTemplate) return "<p>Reminder template not set.</p>";
      return this.highlightKeywords(this.currentStudy.ReminderTemplate);
    },
    followupPreview() {
      if (!this.currentStudy.FollowUPEmailSnippet)
        return "<p>Followup snippet not set.</p>";
      return this.highlightKeywords(this.currentStudy.FollowUPEmailSnippet);
    },
  },

  methods: {
    highlightKeywords(template) {
      const hl = (text) => `<span style="font-weight:700;color:#0D9488">${text}</span>`;
      let email = template;
      email = email.replace(/\${{childName}}/g, hl("Emma"));
      email = email.replace(/\${{he\/she}}/g, hl("she"));
      email = email.replace(/\${{him\/her}}/g, hl("her"));
      email = email.replace(/\${{his\/her}}/g, hl("her"));
      email = email.replace(
        /\${{ZoomLink}}/g,
        '<a href="#" style="font-weight:700;color:#0D9488">Zoom Link</a>'
      );
      return `<p>Dear Lisa,</p><div>${email}</div>`;
    },

    getRoomName(roomId) {
      if (!roomId) return "Unassigned Room";
      const room = this.currentTestingRooms.find((r) => r.id === roomId);
      return room ? room.name : "Unknown Room";
    },

    clearSelection() {
      this.currentStudy = { StudyName: null, PointofContact: {} };
      this.selectedStudies = [];
      this.editedIndex = -1;

      // Clear the URL so it goes back to /study
      if (this.$route.params.id) {
        this.$router.replace({ name: "Study management" });
      }
    },

    canManageStudyStatus(item) {
      if (!item.PointofContact) return false;
      const role = this.store.role;
      return (
        item.PointofContact.id == this.store.userID ||
        ["Admin", "PI", "Lab manager"].includes(role)
      );
    },

    async fetchStudyProgress() {
      this.studyStatsLoaded = false;
      try {
        const Result = await studyApi.studyStats({ studyID: this.currentStudy.id });
        this.studyStats = Result.data;
        this.studyStatsLoaded = true;
      } catch (error) {
        console.error(error);
      }
    },

    async saveEmailTemplates() {
      this.savingTemplates = true;
      try {
        await studyApi.update(this.currentStudy);

        // Sync the master array with the live edits
        const index = this.Studies.findIndex((s) => s.id === this.currentStudy.id);
        if (index !== -1) {
          Object.assign(this.Studies[index], this.currentStudy);
          this.store.setStudies(this.Studies);
        }

        this.$refs.confirmD.open("Saved", "Templates and scripts saved successfully!", {
          color: "success",
          noconfirm: true,
        });
      } catch (error) {
        console.error(error);
        this.$refs.confirmD.open("Error", "Failed to save templates.", {
          color: "error",
          noconfirm: true,
        });
      }
      this.savingTemplates = false;
    },

    criteriaColor(value) {
      if (value === "Exclude") return "error";
      if (value === "Only") return "warning";
      return "grey";
    },

    async optionChangedTestingRoom() {
      if (!this.currentStudy.id) return;
      try {
        await studyApi.update({
          id: this.currentStudy.id,
          FK_TestingRoom: this.selectedRoomId,
        });
        this.currentStudy.FK_TestingRoom = this.selectedRoomId;
      } catch (error) {
        console.error(error);
      }
    },

    async searchStudies() {
      try {
        const Result = await studyApi.search({
          FK_Lab: this.store.lab,
          includeScheules: false,
        });
        this.Studies = Result.data || [];

        // Only auto-select if a study ID is in the route (deep-link)
        if (this.$route.params.id) {
          const targetStudy = this.Studies.find((s) => s.id == this.$route.params.id);
          if (targetStudy) {
            this.selectedStudies = [targetStudy.id];
            this.rowSelected(null, { item: targetStudy });
          }
        }
        // Otherwise, stay on the grid view
      } catch (error) {
        console.error(error);
      }
    },

    async searchLabMembers() {
      try {
        const Result = await personnelApi.search({ FK_Lab: this.store.lab, Active: 1 });
        this.labMembers = Result.data || [];
      } catch (error) {
        console.error(error);
      }
    },

    async changeStudyStatus(item) {
      try {
        this.editedIndex = this.Studies.findIndex((s) => s.id === item.id);
        item.Completed = !item.Completed;
        await studyApi.update(item);
        Object.assign(this.Studies[this.editedIndex], item);
        this.store.setStudies(this.Studies);
      } catch (error) {
        item.Completed = !item.Completed;
        if (error.response?.status !== 401) console.error(error);
      }
    },

    rowSelected(event, { item }) {
      this.currentStudy = item;
      this.selectedStudies = [item.id];
      this.editedIndex = this.Studies.findIndex((s) => s.id === item.id);
      this.selectedRoomId = this.currentStudy.FK_TestingRoom || null;

      // Reset view state
      this.studyTab = "overview";
      this.studyStatsLoaded = false;

      // Update the URL without reloading
      if (this.$route.params.id != item.id) {
        this.$router.replace({ name: "Study management", params: { id: item.id } });
      }
    },

    editStudy() {
      this.editedStudy = {
        ...this.currentStudy,
        AgeGroups: (this.currentStudy.AgeGroups || []).map((g) => ({
          MinAge: g.MinAge,
          MaxAge: g.MaxAge,
        })),
        PrerequisiteIds: (this.currentStudy.Prerequisites || []).map((p) => p.id),
        ExclusionIds: (this.currentStudy.Exclusions || []).map((e) => e.id),
      };
      this.PointofContact = this.currentStudy.PointofContact;

      // Reset Wizard State
      this.studyStepper = 1;
      this.emailTemplateTab = "phone";

      this.dialog = true;
    },

    async createStudy() {
      try {
        const testingRooms = await testingRoomApi.search(this.store.lab);
        this.store.setTestingRooms(testingRooms.data);
        this.currentTestingRooms = testingRooms.data;
      } catch (e) {
        console.error(e);
      }

      this.editedStudy = {
        FK_Lab: this.store.lab,
        StudyType: "Behavioural",
        Completed: false,
        Description: "",
        PhoneScript: "",
        EmailTemplate: "",
        ReminderTemplate: "",
        FollowUPEmailSnippet: "",
        AgeGroups: [],
        PrerequisiteIds: [],
        ExclusionIds: [],
        ASDParticipant: "Include",
        PrematureParticipant: "Include",
        IllParticipant: "Include",
        VisionLossParticipant: "Include",
        HearingLossParticipant: "Include",
      };
      this.PointofContact = null;
      this.editedIndex = -1;
      this.studyStepper = 1; // Reset wizard to step 1
      this.emailTemplateTab = "phone";
      this.dialog = true;
    },

    async duplicateStudy() {
      // 1. Pre-fetch testing rooms if they aren't loaded in the current state
      try {
        if (!this.currentTestingRooms || this.currentTestingRooms.length === 0) {
          const testingRooms = await testingRoomApi.search(this.store.lab);
          this.store.setTestingRooms(testingRooms.data);
          this.currentTestingRooms = testingRooms.data;
        }
      } catch (e) {
        console.error(e);
      }

      // 2. Clone the study data, stripping out DB-specific IDs
      this.editedStudy = {
        ...this.currentStudy,
        id: undefined, // Remove the ID so the backend creates a new record
        StudyName: this.currentStudy.StudyName + " (Copy)",
        Completed: false, // Ensure the duplicate starts as "In Progress"

        // Strip the internal DB IDs from Age Groups so they are created fresh
        AgeGroups: (this.currentStudy.AgeGroups || []).map((g) => ({
          MinAge: g.MinAge,
          MaxAge: g.MaxAge,
        })),

        // Map relational tables back to simple arrays for the creation endpoint
        PrerequisiteIds: (this.currentStudy.Prerequisites || []).map((p) => p.id),
        ExclusionIds: (this.currentStudy.Exclusions || []).map((e) => e.id),
      };

      // 3. Keep the same Point of Contact by default
      this.PointofContact = this.currentStudy.PointofContact || null;

      // 4. Set index to -1 so the save() method knows this is a "Create" action, not an "Update"
      this.editedIndex = -1;

      // 5. Open the Wizard at Step 1
      this.studyStepper = 1;
      this.emailTemplateTab = "phone";
      this.dialog = true;
    },

    async save() {
      const { valid } = await this.$refs.form.validate();
      if (!valid) {
        this.$refs.confirmD.open(
          "Validation Error",
          "Please fill in all required fields and fix any errors before saving.",
          { color: "warning", noconfirm: true }
        );
        return;
      }

      if (!this.PointofContact) {
        this.$refs.confirmD.open(
          "Validation Error",
          "Please select a Point of Contact.",
          { color: "warning", noconfirm: true }
        );
        return;
      }
      this.editedStudy.FK_Personnel = this.PointofContact.id;

      if (this.editedIndex === -1) {
        // Create
        try {
          const Result = await studyApi.create(this.editedStudy);
          this.Studies.push(Result.data);
          this.store.setStudies(this.Studies);
          this.currentStudy = Result.data;
          this.close();
        } catch (error) {
          console.error(error);
        }
      } else {
        // Update
        try {
          const Result = await studyApi.update(this.editedStudy);
          Object.assign(this.Studies[this.editedIndex], Result.data);
          this.store.setStudies(this.Studies);
          this.currentStudy = { ...Result.data };
          this.close();
        } catch (error) {
          console.error(error);
        }
      }
    },

    close() {
      this.dialog = false;
    },

    async deleteStudy() {
      if (
        !(await this.$refs.confirmD.open(
          "Confirm Delete",
          "Are you sure you want to delete this study? The deletion will also remove all related study appointments."
        ))
      ) {
        return;
      }
      try {
        await studyApi.delete({ id: this.currentStudy.id });
        this.Studies = this.Studies.filter((s) => s.id !== this.currentStudy.id);
        this.store.setStudies(this.Studies);
        this.currentStudy = { StudyName: null, PointofContact: {} };
      } catch (error) {
        console.error(error);
      }
    },

    updateExperimenters(updatedExperimenters) {
      this.currentStudy.Experimenters = updatedExperimenters;
      if (this.editedIndex !== -1) {
        Object.assign(this.Studies[this.editedIndex], this.currentStudy);
      }
    },

    AgeFormated(Age) {
      if (!Age || Age <= 0) return "Not applicable";
      const years = Math.floor(Age / 12);
      const months = Age % 12;
      return (
        `${years > 0 ? years + "y" : ""}${months > 0 ? " " + months + "m" : ""}`.trim() ||
        "0m"
      );
    },

    PhoneFormated(Phone) {
      if (Phone) {
        var cleaned = ("" + Phone).replace(/\D/g, "");
        var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) return "(" + match[1] + ") " + match[2] + "-" + match[3];
      }
      return Phone || "";
    },
  },

  watch: {
    studyTab(val) {
      if (val === "analytics" && !this.studyStatsLoaded) {
        this.fetchStudyProgress();
      }
    },
    dialogStudyProgress(val) {
      if (val) {
        this.fetchStudyProgress();
      } else {
        this.studyStats = {
          totalNperStatus: [],
          totalNWeeklyRecrtuiment: [],
          totalNperPersonnelStatus: [],
          totalNperPersonnelPriExp: [],
          totalNperPersonnelAssistExp: [],
          totalCompletedRuns: 0,
        };
      }
    },
    "$route.params.id": {
      immediate: true,
      handler(newId) {
        if (newId && this.Studies.length > 0) {
          const targetStudy = this.Studies.find((s) => s.id == newId);
          if (targetStudy) {
            this.selectedStudies = [targetStudy.id];
            this.rowSelected(null, { item: targetStudy });
          }
        }
      },
    },
  },

  mounted() {
    this.searchLabMembers();
    this.currentTestingRooms = this.store.testingRooms || [];
    this.searchStudies();
  },
};
</script>

<style scoped>
.study-table :deep(tr.v-data-table__selected) {
  background-color: rgb(var(--v-theme-secondary), 0.1) !important;
}

/* Study Hero Header */
.study-hero-header {
  border: none !important;
}

.study-hero-bg {
  background: linear-gradient(
    135deg,
    rgba(30, 64, 175, 0.04) 0%,
    rgba(59, 130, 246, 0.06) 50%,
    rgba(245, 158, 11, 0.03) 100%
  );
  border-bottom: 2px solid rgba(30, 64, 175, 0.12);
}

.study-hero-avatar {
  box-shadow: 0 4px 14px rgba(30, 64, 175, 0.25);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.study-hero-header:hover .study-hero-avatar {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(30, 64, 175, 0.35);
}

/* Restore paragraph spacing in email previews (Vuetify resets <p> margins to 0) */
.template-preview :deep(p) {
  margin-bottom: 0.75em;
  min-height: 1em; /* ensure empty <p> tags (blank lines) are visible */
}
.template-preview :deep(p:last-child) {
  margin-bottom: 0;
}
</style>
